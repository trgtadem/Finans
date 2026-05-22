import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { isFirebaseConfigured } from '../config/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { flushPendingCloudSync } from '../services/sync/cloudSync';
import { logCatch } from '../utils/logger';

const DEBOUNCE_MS = 2000;

export function useAutoCloudUpload() {
    const hasPendingCloudSync = useFinanceStore((s) => s.hasPendingCloudSync);
    const isCloudDataReady = useFinanceStore((s) => s.isCloudDataReady);
    const authMode = useAuthStore((s) => s.authMode);
    const user = useAuthStore((s) => s.user);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const enabled =
        isFirebaseConfigured() && authMode === 'firebase' && !!user?.uid && isCloudDataReady;

    useEffect(() => {
        if (!enabled || !hasPendingCloudSync) {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            flushPendingCloudSync().catch(logCatch('firebase_sync'));
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [enabled, hasPendingCloudSync]);

    useEffect(() => {
        if (!enabled || !hasPendingCloudSync) return;

        const unsub = NetInfo.addEventListener(() => {
            flushPendingCloudSync().catch(logCatch('firebase_sync'));
        });

        return () => unsub();
    }, [enabled, hasPendingCloudSync]);
}
