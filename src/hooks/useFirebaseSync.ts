import { useEffect, useRef } from 'react';
import { isFirebaseConfigured } from '../config/firebase';
import {
    subscribeToUserFinance,
    type UserFinanceData,
    type FinanceSnapshotMeta,
} from '../services/firebase/financeRepository';
import { syncLocalReminderNotifications } from '../services/notifications/reconcileReminders';
import { useAuthStore } from '../store/useAuthStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAppSettingsStore } from '../store/useAppSettingsStore';
import { startFinanceSession, clearFinanceSession } from '../store/financeSession';
import { cloudSnapshotKey, cloudSnapshotKeyFromFinanceData } from '../utils/cloudSnapshot';
import { hasFinanceContent, isRemoteFinanceEmpty } from '../utils/financeData';
import { logCatch, logger } from '../utils/logger';
import {
    setCloudSyncUser,
    beginSuppressCloudUpload,
    endSuppressCloudUpload,
    setLastUploadedSnapshotKey,
    getLastUploadedSnapshotKey,
    flushPendingCloudSync,
    flushFullCloudSync,
} from '../services/sync/cloudSync';

const CLOUD_READY_TIMEOUT_MS = 15_000;

export function useFirebaseSync() {
    const user = useAuthStore((s) => s.user);
    const authMode = useAuthStore((s) => s.authMode);
    const isCloudDataReady = useFinanceStore((s) => s.isCloudDataReady);

    const uploadSuppressed = useRef(0);
    const userIdRef = useRef<string | null>(null);
    const prevUidRef = useRef<string | null>(null);
    const hasReceivedInitialSnapshot = useRef(false);
    const lastUploadedUpdatedAt = useRef<string | null>(null);

    const beginSuppressUpload = () => {
        uploadSuppressed.current += 1;
        beginSuppressCloudUpload();
    };
    const endSuppressUpload = () => {
        uploadSuppressed.current = Math.max(0, uploadSuppressed.current - 1);
        endSuppressCloudUpload();
    };

    const markCloudReady = () => {
        if (hasReceivedInitialSnapshot.current) return;
        hasReceivedInitialSnapshot.current = true;
        useFinanceStore.getState().setCloudDataReady(true);
    };

    const scheduleNotificationSync = () => {
        const reconcile = useAppSettingsStore.getState().reconcileNotificationsOnRemoteSync;
        if (!reconcile) return;
        syncLocalReminderNotifications(useFinanceStore.getState().reminders).catch(
            logCatch('notifications')
        );
    };

    const applyRemoteData = (
        data: {
            transactions: ReturnType<typeof useFinanceStore.getState>['transactions'];
            reminders: ReturnType<typeof useFinanceStore.getState>['reminders'];
            incomeCategories: string[];
            expenseCategories: string[];
            monthlyExpenseBudget?: number | null;
            updatedAt: string;
        },
        options: { isInitial: boolean; fromOtherDevice: boolean }
    ) => {
        beginSuppressUpload();
        try {
            const store = useFinanceStore.getState();
            store.hydrateFromCloud(
                {
                    transactions: data.transactions,
                    reminders: data.reminders,
                    incomeCategories: data.incomeCategories,
                    expenseCategories: data.expenseCategories,
                    monthlyExpenseBudget: data.monthlyExpenseBudget,
                },
                data.updatedAt
            );

            if (options.isInitial) {
                markCloudReady();
            }

            if (options.isInitial || options.fromOtherDevice) {
                scheduleNotificationSync();
            }
        } finally {
            endSuppressUpload();
        }
    };

    const handleRemoteSnapshot = (data: UserFinanceData, meta: FinanceSnapshotMeta) => {
        const store = useFinanceStore.getState();
        const cloudAt = store.cloudUpdatedAt ?? '';
        const localHasData = hasFinanceContent(store);
        const remoteContentKey = cloudSnapshotKeyFromFinanceData(data);

        const isTimestampEcho =
            lastUploadedUpdatedAt.current != null &&
            data.updatedAt === lastUploadedUpdatedAt.current;

        const isContentEcho =
            getLastUploadedSnapshotKey() != null &&
            getLastUploadedSnapshotKey() === remoteContentKey;

        if (isTimestampEcho || isContentEcho) {
            store.setLastSyncAt(data.updatedAt);
            store.setCloudUpdatedAt(data.updatedAt);
            store.clearPendingCloudSync();
            markCloudReady();
            return;
        }

        const isInitial = !hasReceivedInitialSnapshot.current;

        if (!isInitial && cloudAt && data.updatedAt <= cloudAt) {
            return;
        }

        if (isInitial) {
            if (!meta.exists && localHasData) {
                markCloudReady();
                scheduleNotificationSync();
                flushFullCloudSync().catch(logCatch('firebase_sync'));
                return;
            }

            if (meta.exists && isRemoteFinanceEmpty(data) && localHasData) {
                markCloudReady();
                scheduleNotificationSync();
                flushFullCloudSync().catch(logCatch('firebase_sync'));
                return;
            }

            if (meta.exists && localHasData && cloudAt && data.updatedAt <= cloudAt) {
                markCloudReady();
                scheduleNotificationSync();
                return;
            }
        }

        const fromOtherDevice = !isInitial && data.updatedAt > cloudAt;

        applyRemoteData(
            {
                transactions: data.transactions,
                reminders: data.reminders,
                incomeCategories: data.incomeCategories,
                expenseCategories: data.expenseCategories,
                monthlyExpenseBudget: data.monthlyExpenseBudget,
                updatedAt: data.updatedAt,
            },
            { isInitial, fromOtherDevice }
        );

        lastUploadedUpdatedAt.current = data.updatedAt;
        setLastUploadedSnapshotKey(remoteContentKey);
    };

    useEffect(() => {
        if (!isFirebaseConfigured() || authMode !== 'firebase') {
            setCloudSyncUser(null, false);
            return;
        }

        if (!user?.uid) {
            if (prevUidRef.current) {
                prevUidRef.current = null;
                userIdRef.current = null;
                hasReceivedInitialSnapshot.current = false;
                lastUploadedUpdatedAt.current = null;
                setLastUploadedSnapshotKey(null);
                setCloudSyncUser(null, false);
                clearFinanceSession().catch(logCatch('session'));
            }
            return;
        }

        const uid = user.uid;
        const switchedAccount =
            prevUidRef.current != null && prevUidRef.current !== uid;

        prevUidRef.current = uid;
        userIdRef.current = uid;
        hasReceivedInitialSnapshot.current = false;
        lastUploadedUpdatedAt.current = null;
        setLastUploadedSnapshotKey(null);
        setCloudSyncUser(uid, true);

        let cancelled = false;
        let unsubscribeRemote: (() => void) | undefined;

        const readyTimeout = setTimeout(() => {
            if (!hasReceivedInitialSnapshot.current) {
                logger.firebaseSync.warn(
                    'Cloud snapshot timeout; continuing with local cache'
                );
                markCloudReady();
            }
        }, CLOUD_READY_TIMEOUT_MS);

        (async () => {
            try {
                await startFinanceSession(uid, { reset: switchedAccount });
            } catch (err) {
                logger.firebaseSync.error('Finance session bootstrap failed', err);
                useFinanceStore.getState().setSyncError(
                    'Yerel veriler yüklendi; bulut bağlantısı kurulamadı.'
                );
                markCloudReady();
            }

            if (cancelled) return;

            unsubscribeRemote = subscribeToUserFinance(
                uid,
                (data, meta) => {
                    handleRemoteSnapshot(data, meta);
                },
                {
                    onError: (message) => {
                        useFinanceStore.getState().setSyncError(message);
                        markCloudReady();
                    },
                }
            );
        })();

        return () => {
            cancelled = true;
            clearTimeout(readyTimeout);
            unsubscribeRemote?.();
            setCloudSyncUser(null, false);
        };
    }, [user?.uid, authMode]);

    useEffect(() => {
        if (!isFirebaseConfigured() || authMode !== 'firebase' || !user?.uid) return;

        let prevPending = useFinanceStore.getState().hasPendingCloudSync;
        const unsub = useFinanceStore.subscribe((state) => {
            const pending = state.hasPendingCloudSync;
            if (pending && !prevPending && hasReceivedInitialSnapshot.current) {
                flushPendingCloudSync().catch(logCatch('firebase_sync'));
            }
            prevPending = pending;
        });

        return unsub;
    }, [user?.uid, authMode]);

    return { isCloudDataReady };
}

/** Manuel senkron ve ayarlar ekranı */
export async function syncNowFull(): Promise<void> {
    await flushFullCloudSync();
}

export async function syncNowPending(): Promise<void> {
    await flushPendingCloudSync();
}
