import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { authenticateWithBiometric } from '../utils/biometricAuth';

interface AppLockState {
    biometricLockEnabled: boolean;
    isLocked: boolean;
    lastBackgroundAt: number | null;
    setBiometricLockEnabled: (enabled: boolean) => Promise<boolean>;
    lock: () => void;
    unlock: () => Promise<boolean>;
    initAppStateListener: () => () => void;
}

const BACKGROUND_LOCK_MS = 30_000;

export const useAppLockStore = create<AppLockState>()(
    persist(
        (set, get) => ({
            biometricLockEnabled: false,
            isLocked: false,
            lastBackgroundAt: null,

            setBiometricLockEnabled: async (enabled) => {
                if (enabled) {
                    const ok = await authenticateWithBiometric(
                        'Uygulama kilidini etkinleştirmek için doğrulayın'
                    );
                    if (!ok) return false;
                }
                set({ biometricLockEnabled: enabled, isLocked: false });
                return true;
            },

            lock: () => {
                if (get().biometricLockEnabled) {
                    set({ isLocked: true });
                }
            },

            unlock: async () => {
                if (!get().biometricLockEnabled) {
                    set({ isLocked: false });
                    return true;
                }
                const ok = await authenticateWithBiometric('Finans uygulamasının kilidini açın');
                if (ok) set({ isLocked: false });
                return ok;
            },

            initAppStateListener: () => {
                const handler = (next: AppStateStatus) => {
                    const state = get();
                    if (!state.biometricLockEnabled) return;

                    if (next === 'background' || next === 'inactive') {
                        set({ lastBackgroundAt: Date.now() });
                    }

                    if (next === 'active') {
                        const bg = state.lastBackgroundAt;
                        if (bg && Date.now() - bg >= BACKGROUND_LOCK_MS) {
                            set({ isLocked: true });
                        }
                        set({ lastBackgroundAt: null });
                    }
                };

                const sub = AppState.addEventListener('change', handler);
                return () => sub.remove();
            },
        }),
        {
            name: 'app-lock-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (s) => ({ biometricLockEnabled: s.biometricLockEnabled }),
        }
    )
);
