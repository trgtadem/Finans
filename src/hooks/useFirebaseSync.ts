import { useEffect, useRef } from 'react';
import { isFirebaseConfigured } from '../config/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { startFinanceSession, clearFinanceSession } from '../store/financeSession';
import { logCatch } from '../utils/logger';
import {
    setCloudSyncUser,
    syncOnLogin,
} from '../services/sync/cloudSync';

export function useFirebaseSync() {
    const user = useAuthStore((s) => s.user);
    const authMode = useAuthStore((s) => s.authMode);
    const cloudPullRequested = useAuthStore((s) => s.cloudPullRequested);
    const clearCloudPullRequested = useAuthStore((s) => s.clearCloudPullRequested);
    const isFinanceReady = useFinanceStore((s) => s.isCloudDataReady);

    const prevUidRef = useRef<string | null>(null);
    const loginPullDoneRef = useRef(false);

    useEffect(() => {
        if (!isFirebaseConfigured() || authMode !== 'firebase') {
            setCloudSyncUser(null, false);
            return;
        }

        if (!user?.uid) {
            if (prevUidRef.current) {
                prevUidRef.current = null;
                loginPullDoneRef.current = false;
                setCloudSyncUser(null, false);
                clearFinanceSession().catch(logCatch('session'));
            }
            return;
        }

        const uid = user.uid;
        const switchedAccount =
            prevUidRef.current != null && prevUidRef.current !== uid;
        const shouldPullOnLogin =
            (cloudPullRequested || switchedAccount) && !loginPullDoneRef.current;

        prevUidRef.current = uid;
        setCloudSyncUser(uid, true);

        let cancelled = false;

        (async () => {
            try {
                await startFinanceSession(uid, { reset: switchedAccount });
            } catch (err) {
                logCatch('session');
                useFinanceStore.getState().setSyncError(
                    'Yerel önbellek yüklenemedi.'
                );
            }

            if (cancelled) return;

            if (shouldPullOnLogin) {
                loginPullDoneRef.current = true;
                clearCloudPullRequested();
                try {
                    await syncOnLogin(uid);
                } catch {
                    logCatch('firebase_sync');
                }
            }
        })();

        return () => {
            cancelled = true;
            setCloudSyncUser(null, false);
        };
    }, [user?.uid, authMode, cloudPullRequested, clearCloudPullRequested]);

    return { isFinanceReady };
}

export async function syncNowUpload(): Promise<void> {
    const { flushFullCloudSync } = await import('../services/sync/cloudSync');
    await flushFullCloudSync({ force: true });
}

export async function syncNowPull(): Promise<void> {
    const { pullCloudSnapshotOnce, setCloudSyncUser } = await import(
        '../services/sync/cloudSync'
    );
    const uid = useAuthStore.getState().user?.uid;
    if (!uid) return;
    setCloudSyncUser(uid, true);
    await pullCloudSnapshotOnce(uid, { userMessage: 'Veriler buluttan indirildi.' });
}
