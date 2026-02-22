import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
    password: string | null;
    isAuthenticated: boolean;
    setPassword: (password: string) => void;
    login: (password: string) => boolean;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            password: null, // Initial password setup required if null
            isAuthenticated: false,

            setPassword: (password) => set({ password, isAuthenticated: true }),

            login: (password) => {
                const storedPassword = get().password;
                if (!storedPassword || storedPassword === password) {
                    set({ isAuthenticated: true });
                    return true;
                }
                return false;
            },

            logout: () => set({ isAuthenticated: false }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
