import { useEffect, useRef } from 'react';
import { isFirebaseConfigured } from '../config/firebase';
import {
    subscribeToUserFinance,
    saveUserFinance,
    type UserFinanceData,
    type FinanceSnapshotMeta,
} from '../services/firebase/userData';
import { syncLocalReminderNotifications } from '../services/notifications/reconcileReminders';
import { useAuthStore } from '../store/useAuthStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { startFinanceSession, clearFinanceSession } from '../store/financeSession';
import { cloudSnapshotKey } from '../utils/cloudSnapshot';
import { hasFinanceContent, isRemoteFinanceEmpty } from '../utils/financeData';
import { feedback } from '../components/feedback';
import { logCatch, logger } from '../utils/logger';

const SYNC_DEBOUNCE_MS = 400;
const CLOUD_READY_TIMEOUT_MS = 15_000;

export function useFirebaseSync() {
    const user = useAuthStore((s) => s.user);
    const authMode = useAuthStore((s) => s.authMode);
    const isCloudDataReady = useFinanceStore((s) => s.isCloudDataReady);

    const uploadSuppressed = useRef(0);
    const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const userIdRef = useRef<string | null>(null);
    const prevUidRef = useRef<string | null>(null);
    const hasReceivedInitialSnapshot = useRef(false);
    const lastUploadedUpdatedAt = useRef<string | null>(null);
    const lastUploadedSnapshotKey = useRef<string | null>(null);

    const beginSuppressUpload = () => {
        uploadSuppressed.current += 1;
    };
    const endSuppressUpload = () => {
        uploadSuppressed.current = Math.max(0, uploadSuppressed.current - 1);
    };

    const markCloudReady = () => {
        if (hasReceivedInitialSnapshot.current) return;
        hasReceivedInitialSnapshot.current = true;
        useFinanceStore.getState().setCloudDataReady(true);
    };

    const scheduleNotificationSync = () => {
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

        const isEcho =
            lastUploadedUpdatedAt.current != null &&
            data.updatedAt === lastUploadedUpdatedAt.current;

        if (isEcho) {
            store.setLastSyncAt(data.updatedAt);
            store.setCloudUpdatedAt(data.updatedAt);
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
                return;
            }

            if (meta.exists && isRemoteFinanceEmpty(data) && localHasData) {
                markCloudReady();
                scheduleNotificationSync();
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
                updatedAt: data.updatedAt,
            },
            { isInitial, fromOtherDevice }
        );
    };

    useEffect(() => {
        if (!isFirebaseConfigured() || authMode !== 'firebase') return;

        if (!user?.uid) {
            if (prevUidRef.current) {
                prevUidRef.current = null;
                userIdRef.current = null;
                hasReceivedInitialSnapshot.current = false;
                lastUploadedUpdatedAt.current = null;
                lastUploadedSnapshotKey.current = null;
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
        lastUploadedSnapshotKey.current = null;

        let cancelled = false;
        let unsubscribeRemote: (() => void) | undefined;
        let unsubscribeLocal: (() => void) | undefined;

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
                markCloudReady();
            }

            if (cancelled) return;

            unsubscribeRemote = subscribeToUserFinance(uid, (data, meta) => {
                handleRemoteSnapshot(data, meta);
            });

            unsubscribeLocal = useFinanceStore.subscribe(() => {
                if (!hasReceivedInitialSnapshot.current) return;
                if (uploadSuppressed.current > 0) return;
                if (!userIdRef.current) return;

                if (syncTimer.current) clearTimeout(syncTimer.current);
                syncTimer.current = setTimeout(async () => {
                    if (uploadSuppressed.current > 0) return;

                    const activeUid = userIdRef.current;
                    if (!activeUid || !useFinanceStore.getState().isCloudDataReady) return;

                    const store = useFinanceStore.getState();
                    const snapshot = store.getCloudSnapshot();
                    const snapshotKey = cloudSnapshotKey(snapshot);
                    if (snapshotKey === lastUploadedSnapshotKey.current) return;

                    store.setIsSyncing(true);
                    store.clearSyncError();

                    try {
                        const uploadedAt = await saveUserFinance(
                            activeUid,
                            snapshot,
                            { ifRemoteOlderThan: store.cloudUpdatedAt ?? undefined }
                        );
                        lastUploadedUpdatedAt.current = uploadedAt;
                        lastUploadedSnapshotKey.current = snapshotKey;
                        store.setLastSyncAt(uploadedAt);
                        store.setCloudUpdatedAt(uploadedAt);
                        store.clearSyncError();
                    } catch (err) {
                        if (
                            err instanceof Error &&
                            err.message === 'REMOTE_NEWER_THAN_LOCAL'
                        ) {
                            feedback.warning(
                                'Buluttaki veri daha yeni; yerel değişiklik atlandı.'
                            );
                        } else {
                            store.setSyncError(
                                'Veriler kaydedilemedi. Bağlantınızı kontrol edin.'
                            );
                        }
                    } finally {
                        store.setIsSyncing(false);
                    }
                }, SYNC_DEBOUNCE_MS);
            });
        })();

        return () => {
            cancelled = true;
            clearTimeout(readyTimeout);
            unsubscribeRemote?.();
            unsubscribeLocal?.();
            if (syncTimer.current) clearTimeout(syncTimer.current);
        };
    }, [user?.uid, authMode]);

    return { isCloudDataReady };
}
