import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { isFirebaseConfigured } from '../config/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { flushPendingCloudSync } from '../services/sync/cloudSync';
import { logCatch } from '../utils/logger';

export function useSyncLifecycle() {
    const authMode = useAuthStore((s) => s.authMode);
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        if (!isFirebaseConfigured() || authMode !== 'firebase' || !user?.uid) return;

        const onChange = (next: AppStateStatus) => {
            if (next === 'background' || next === 'inactive') {
                flushPendingCloudSync().catch(logCatch('firebase_sync'));
            }
        };

        const sub = AppState.addEventListener('change', onChange);
        return () => sub.remove();
    }, [user?.uid, authMode]);
}
