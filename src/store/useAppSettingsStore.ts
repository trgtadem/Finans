import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettingsState {
    syncDebounceMs: number;
    syncOnCellular: boolean;
    reconcileNotificationsOnRemoteSync: boolean;
    lowPowerMode: boolean;
    historyPageSize: number;
    hasCompletedOnboarding: boolean;
    setSyncDebounceMs: (ms: number) => void;
    setSyncOnCellular: (enabled: boolean) => void;
    setReconcileNotificationsOnRemoteSync: (enabled: boolean) => void;
    setLowPowerMode: (enabled: boolean) => void;
    setHistoryPageSize: (size: number) => void;
    setHasCompletedOnboarding: (done: boolean) => void;
}

export const useAppSettingsStore = create<AppSettingsState>()(
    persist(
        (set) => ({
            syncDebounceMs: 400,
            syncOnCellular: true,
            reconcileNotificationsOnRemoteSync: true,
            lowPowerMode: false,
            historyPageSize: 50,
            hasCompletedOnboarding: false,

            setSyncDebounceMs: (ms) =>
                set({ syncDebounceMs: Math.min(5000, Math.max(0, ms)) }),
            setSyncOnCellular: (enabled) => set({ syncOnCellular: enabled }),
            setReconcileNotificationsOnRemoteSync: (enabled) =>
                set({ reconcileNotificationsOnRemoteSync: enabled }),
            setLowPowerMode: (enabled) => set({ lowPowerMode: enabled }),
            setHistoryPageSize: (size) =>
                set({ historyPageSize: Math.min(500, Math.max(20, size)) }),
            setHasCompletedOnboarding: (done) => set({ hasCompletedOnboarding: done }),
        }),
        {
            name: 'app-settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
