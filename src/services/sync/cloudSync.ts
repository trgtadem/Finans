import NetInfo from '@react-native-community/netinfo';
import {
    upsertTransaction,
    upsertReminder,
    deleteTransactionDoc,
    deleteReminderDoc,
    patchSettings,
    saveUserFinance,
    fetchUserFinanceOnce,
    type SettingsPatch,
} from '../firebase/financeRepository';
import { useFinanceStore, type Transaction, type Reminder } from '../../store/useFinanceStore';
import { useAppSettingsStore } from '../../store/useAppSettingsStore';
import { cloudSnapshotKey } from '../../utils/cloudSnapshot';
import { logCatch, logger } from '../../utils/logger';
import { feedback } from '../../components/feedback';

export type CloudDelta =
    | { type: 'upsertTransaction'; tx: Transaction }
    | { type: 'deleteTransaction'; id: string }
    | { type: 'upsertReminder'; reminder: Reminder }
    | { type: 'deleteReminder'; id: string }
    | { type: 'patchSettings'; patch: SettingsPatch };

let activeUserId: string | null = null;
let syncEnabled = false;
let uploadSuppressed = 0;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;
const deltaQueue: CloudDelta[] = [];

export function setCloudSyncUser(userId: string | null, enabled: boolean) {
    activeUserId = userId;
    syncEnabled = enabled;
    if (!userId) {
        deltaQueue.length = 0;
        if (debounceTimer) clearTimeout(debounceTimer);
    }
}

export function beginSuppressCloudUpload() {
    uploadSuppressed += 1;
}

export function endSuppressCloudUpload() {
    uploadSuppressed = Math.max(0, uploadSuppressed - 1);
}

export function enqueueCloudDelta(delta: CloudDelta) {
    if (!syncEnabled || !activeUserId) return;
    useFinanceStore.getState().markDataDirty();
    deltaQueue.push(delta);
    scheduleDeltaFlush();
}

async function canUploadNow(): Promise<boolean> {
    const { syncOnCellular } = useAppSettingsStore.getState();
    if (syncOnCellular) return true;
    const state = await NetInfo.fetch();
    return state.type === 'wifi' || state.type === 'ethernet';
}

function scheduleDeltaFlush() {
    const debounceMs = useAppSettingsStore.getState().syncDebounceMs;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        flushCloudDeltas().catch(logCatch('firebase_sync'));
    }, debounceMs);
}

async function applyDelta(uid: string, delta: CloudDelta): Promise<string> {
    switch (delta.type) {
        case 'upsertTransaction':
            return upsertTransaction(uid, delta.tx);
        case 'deleteTransaction':
            return deleteTransactionDoc(uid, delta.id);
        case 'upsertReminder':
            return upsertReminder(uid, delta.reminder);
        case 'deleteReminder':
            return deleteReminderDoc(uid, delta.id);
        case 'patchSettings':
            return patchSettings(uid, delta.patch);
    }
}

export async function flushCloudDeltas(): Promise<void> {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
    if (
        !syncEnabled ||
        !activeUserId ||
        uploadSuppressed > 0 ||
        isFlushing ||
        deltaQueue.length === 0
    ) {
        return;
    }

    const store = useFinanceStore.getState();
    if (!store.isCloudDataReady) return;

    if (!(await canUploadNow())) {
        logger.firebaseSync.log('Upload paused: Wi‑Fi only mode');
        return;
    }

    const uid = activeUserId;
    const batch = [...deltaQueue];
    deltaQueue.length = 0;

    isFlushing = true;
    store.setIsSyncing(true);
    store.clearSyncError();

    try {
        let lastAt = store.cloudUpdatedAt ?? new Date().toISOString();
        for (const delta of batch) {
            lastAt = await applyDelta(uid, delta);
        }
        store.setLastSyncAt(lastAt);
        store.setCloudUpdatedAt(lastAt);
        store.clearPendingCloudSync();
        store.clearSyncError();
    } catch (err) {
        deltaQueue.unshift(...batch);
        if (err instanceof Error && err.message === 'REMOTE_NEWER_THAN_LOCAL') {
            await pullRemoteAndHydrate(uid, 'Diğer cihazdaki güncel veriler yüklendi.');
        } else {
            logger.firebaseSync.error('flushCloudDeltas failed', err);
            store.setSyncError('Veriler kaydedilemedi. Bağlantınızı kontrol edin.');
        }
    } finally {
        isFlushing = false;
        store.setIsSyncing(false);
    }
}

export async function flushFullCloudSync(): Promise<void> {
    if (!syncEnabled || !activeUserId || uploadSuppressed > 0) return;

    const store = useFinanceStore.getState();
    if (!store.isCloudDataReady) return;

    if (!(await canUploadNow())) {
        store.setSyncError('Senkron için Wi‑Fi bağlantısı gerekli.');
        return;
    }

    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
    deltaQueue.length = 0;

    const uid = activeUserId;
    const snapshot = store.getCloudSnapshot();
    const snapshotKey = cloudSnapshotKey(snapshot);

    isFlushing = true;
    store.setIsSyncing(true);
    store.clearSyncError();

    try {
        const uploadedAt = await saveUserFinance(uid, snapshot, {
            ifRemoteOlderThan: store.cloudUpdatedAt ?? undefined,
        });
        store.setLastSyncAt(uploadedAt);
        store.setCloudUpdatedAt(uploadedAt);
        store.clearPendingCloudSync();
        store.clearSyncError();
        lastFullSnapshotKey = snapshotKey;
    } catch (err) {
        if (err instanceof Error && err.message === 'REMOTE_NEWER_THAN_LOCAL') {
            await pullRemoteAndHydrate(uid, 'Diğer cihazdaki güncel veriler yüklendi.');
        } else {
            logger.firebaseSync.error('flushFullCloudSync failed', err);
            store.setSyncError('Tam senkron başarısız. Bağlantınızı kontrol edin.');
            throw err;
        }
    } finally {
        isFlushing = false;
        store.setIsSyncing(false);
    }
}

let lastFullSnapshotKey: string | null = null;

export function setLastUploadedSnapshotKey(key: string | null) {
    lastFullSnapshotKey = key;
}

export function getLastUploadedSnapshotKey() {
    return lastFullSnapshotKey;
}

export async function pullRemoteAndHydrate(
    userId: string,
    userMessage?: string
): Promise<void> {
    beginSuppressCloudUpload();
    try {
        const remote = await fetchUserFinanceOnce(userId);
        const store = useFinanceStore.getState();
        store.hydrateFromCloud(
            {
                transactions: remote.transactions,
                reminders: remote.reminders,
                incomeCategories: remote.incomeCategories,
                expenseCategories: remote.expenseCategories,
                monthlyExpenseBudget: remote.monthlyExpenseBudget,
            },
            remote.updatedAt
        );
        store.clearPendingCloudSync();
        store.setLastSyncAt(remote.updatedAt);
        lastFullSnapshotKey = cloudSnapshotKey({
            transactions: remote.transactions,
            reminders: remote.reminders,
            incomeCategories: remote.incomeCategories,
            expenseCategories: remote.expenseCategories,
            monthlyExpenseBudget: remote.monthlyExpenseBudget ?? null,
        });

        const reconcile = useAppSettingsStore.getState().reconcileNotificationsOnRemoteSync;
        if (reconcile) {
            const { syncLocalReminderNotifications } = await import(
                '../notifications/reconcileReminders'
            );
            await syncLocalReminderNotifications(store.reminders);
        }

        if (userMessage) {
            feedback.success(userMessage);
        }
    } finally {
        endSuppressCloudUpload();
    }
}

/** Arka plan / manuel: bekleyen delta + tam snapshot gerekirse */
export async function flushPendingCloudSync(): Promise<void> {
    if (deltaQueue.length > 0) {
        await flushCloudDeltas();
        return;
    }
    const store = useFinanceStore.getState();
    if (store.hasPendingCloudSync) {
        await flushFullCloudSync();
    }
}
