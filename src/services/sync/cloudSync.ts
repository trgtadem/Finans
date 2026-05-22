import NetInfo from '@react-native-community/netinfo';
import { saveUserFinance, fetchUserFinanceOnce } from '../firebase/financeRepository';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAppSettingsStore } from '../../store/useAppSettingsStore';
import { cloudSnapshotKey } from '../../utils/cloudSnapshot';
import { logCatch, logger } from '../../utils/logger';
import { feedback } from '../../components/feedback';

let activeUserId: string | null = null;
let syncEnabled = false;
let isFlushing = false;

export function setCloudSyncUser(userId: string | null, enabled: boolean) {
    activeUserId = userId;
    syncEnabled = enabled;
}

async function isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
}

async function canUploadNow(): Promise<boolean> {
    if (!(await isOnline())) return false;
    const { syncOnCellular } = useAppSettingsStore.getState();
    if (syncOnCellular) return true;
    const state = await NetInfo.fetch();
    return state.type === 'wifi' || state.type === 'ethernet';
}

export type PendingSyncReason = 'offline' | 'wifi';

/** Bekleyen yedekleme neden yapılamıyor; null = yükleme mümkün. */
export async function getPendingSyncReason(): Promise<PendingSyncReason | null> {
    if (!(await isOnline())) return 'offline';
    if (!(await canUploadNow())) return 'wifi';
    return null;
}

async function reconcileNotificationsAfterPull() {
    const reconcile = useAppSettingsStore.getState().reconcileNotificationsOnRemoteSync;
    if (!reconcile) return;
    const { syncLocalReminderNotifications } = await import(
        '../notifications/reconcileReminders'
    );
    const updates = await syncLocalReminderNotifications(
        useFinanceStore.getState().reminders
    );
    useFinanceStore.getState().applyReminderSchedules(updates);
}

/** Buluttan tek seferlik indirme → yerel önbellek */
export async function pullCloudSnapshotOnce(
    userId: string,
    options?: { userMessage?: string }
): Promise<void> {
    if (!syncEnabled || !activeUserId) return;

    const store = useFinanceStore.getState();
    if (!(await isOnline())) {
        store.setSyncError('İndirme için internet bağlantısı gerekli.');
        return;
    }

    store.setIsSyncing(true);
    store.clearSyncError();

    try {
        const remote = await fetchUserFinanceOnce(userId);
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
        store.setLastSyncAt(remote.updatedAt);
        store.clearSyncError();
        await reconcileNotificationsAfterPull();

        if (options?.userMessage) {
            feedback.success(options.userMessage);
        }
    } catch (err) {
        logger.firebaseSync.error('pullCloudSnapshotOnce failed', err);
        store.setSyncError('Buluttan veri alınamadı. Bağlantınızı kontrol edin.');
        throw err;
    } finally {
        store.setIsSyncing(false);
    }
}

/** Tam snapshot yükleme — yalnızca bekleyen değişiklik varsa (veya force) */
export async function flushFullCloudSync(options?: { force?: boolean }): Promise<void> {
    if (!syncEnabled || !activeUserId || isFlushing) return;

    const store = useFinanceStore.getState();
    if (!store.isCloudDataReady) return;

    if (!options?.force && !store.hasPendingCloudSync) return;

    if (!(await canUploadNow())) {
        return;
    }

    const uid = activeUserId;
    const snapshot = store.getCloudSnapshot();

    isFlushing = true;
    store.setIsSyncing(true);
    store.clearSyncError();

    try {
        const uploadedAt = await saveUserFinance(uid, snapshot);
        store.setLastSyncAt(uploadedAt);
        store.setCloudUpdatedAt(uploadedAt);
        store.clearPendingCloudSync();
        store.clearSyncError();
        void cloudSnapshotKey(snapshot);
    } catch (err) {
        logger.firebaseSync.error('flushFullCloudSync failed', err);
        store.setSyncError('Buluta kaydedilemedi. Bağlantınızı kontrol edin.');
        throw err;
    } finally {
        isFlushing = false;
        store.setIsSyncing(false);
    }
}

/** Giriş: önce bekleyen yükleme, sonra buluttan indir */
export async function syncOnLogin(userId: string): Promise<void> {
    if (!syncEnabled) return;

    const store = useFinanceStore.getState();
    if (store.hasPendingCloudSync && (await canUploadNow())) {
        try {
            await flushFullCloudSync({ force: true });
        } catch {
            logger.firebaseSync.warn('Login upload skipped; will try pull');
        }
    }

    if (await isOnline()) {
        await pullCloudSnapshotOnce(userId);
    } else if (!store.transactions.length && !store.reminders.length) {
        store.setSyncError('Çevrimdışısınız; veriler buluttan yüklenemedi.');
    }
}

/** Arka plan / kapanış: yalnızca dirty ise yükle */
export async function flushPendingCloudSync(): Promise<void> {
    await flushFullCloudSync();
}
