import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured } from '../config/firebase';
import {
    signInWithEmail,
    signUpWithEmail,
    signOut as firebaseSignOut,
    subscribeToAuthState,
    resetPassword,
    changePassword,
    isAuthAvailable,
} from '../services/firebase/auth';
import {
    registerForPushNotifications,
    savePushTokenToFirestore,
} from '../services/firebase/push';
import { saveUserFinance, DEFAULT_FINANCE_DATA } from '../services/firebase/userData';
import {
    setFinanceStorageUserId,
    rehydrateFinanceStore,
    clearFinanceSession,
} from './financeSession';
import {
    saveLocalPin,
    verifyLocalPin,
    hasLocalPin,
    clearLocalPin,
} from '../utils/securePin';
import { logCatch } from '../utils/logger';

interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
}

interface AuthState {
    hasLocalPinSetup: boolean;
    isAuthenticated: boolean;
    isLoading: boolean;
    authMode: 'local' | 'firebase';
    user: AuthUser | null;
    authError: string | null;

    initialize: () => () => void;
    checkLocalPinSetup: () => Promise<void>;
    setPassword: (password: string) => Promise<void>;
    login: (password: string) => Promise<boolean>;
    loginWithEmail: (email: string, password: string) => Promise<boolean>;
    registerWithEmail: (email: string, password: string) => Promise<boolean>;
    sendPasswordReset: (email: string) => Promise<void>;
    updateFirebasePassword: (current: string, next: string) => Promise<void>;
    logout: () => Promise<void>;
    clearAuthError: () => void;
}

function mapFirebaseUser(user: User): AuthUser {
    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
    };
}

async function syncPushToken(userId: string) {
    const token = await registerForPushNotifications();
    if (token) {
        await savePushTokenToFirestore(userId, token);
    }
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            hasLocalPinSetup: false,
            isAuthenticated: false,
            isLoading: true,
            authMode: isFirebaseConfigured() ? 'firebase' : 'local',
            user: null,
            authError: null,

            initialize: () => {
                if (!isAuthAvailable()) {
                    get().checkLocalPinSetup().finally(() => set({ isLoading: false }));
                    return () => {};
                }

                set({ authMode: 'firebase', isLoading: true });

                const unsubscribe = subscribeToAuthState((firebaseUser) => {
                    if (firebaseUser) {
                        set({
                            isAuthenticated: true,
                            user: mapFirebaseUser(firebaseUser),
                            isLoading: false,
                            authError: null,
                        });
                        syncPushToken(firebaseUser.uid).catch(logCatch('firebase_push'));
                    } else {
                        set({
                            isAuthenticated: false,
                            user: null,
                            isLoading: false,
                        });
                    }
                });

                return unsubscribe;
            },

            checkLocalPinSetup: async () => {
                const exists = await hasLocalPin();
                set({ hasLocalPinSetup: exists });
            },

            setPassword: async (password) => {
                await saveLocalPin(password);
                setFinanceStorageUserId(null);
                set({ hasLocalPinSetup: true, isAuthenticated: true, authMode: 'local' });
                await rehydrateFinanceStore();
            },

            login: async (password) => {
                const valid = await verifyLocalPin(password);
                if (!valid) return false;
                setFinanceStorageUserId(null);
                set({ isAuthenticated: true, authMode: 'local' });
                await rehydrateFinanceStore();
                return true;
            },

            loginWithEmail: async (email, password) => {
                set({ authError: null });
                try {
                    const user = await signInWithEmail(email.trim(), password);
                    set({
                        isAuthenticated: true,
                        user: mapFirebaseUser(user),
                        authMode: 'firebase',
                    });
                    return true;
                } catch (error: unknown) {
                    const message =
                        error instanceof Error ? error.message : 'Giriş başarısız.';
                    set({ authError: mapAuthError(message) });
                    return false;
                }
            },

            registerWithEmail: async (email, password) => {
                set({ authError: null });
                try {
                    const user = await signUpWithEmail(email.trim(), password);
                    await saveUserFinance(user.uid, {
                        transactions: [],
                        reminders: [],
                        incomeCategories: DEFAULT_FINANCE_DATA.incomeCategories,
                        expenseCategories: DEFAULT_FINANCE_DATA.expenseCategories,
                    });
                    set({
                        isAuthenticated: true,
                        user: mapFirebaseUser(user),
                        authMode: 'firebase',
                    });
                    return true;
                } catch (error: unknown) {
                    const message =
                        error instanceof Error ? error.message : 'Kayıt başarısız.';
                    set({ authError: mapAuthError(message) });
                    return false;
                }
            },

            sendPasswordReset: async (email) => {
                set({ authError: null });
                try {
                    await resetPassword(email.trim());
                } catch (error: unknown) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : 'Şifre sıfırlama başarısız.';
                    set({ authError: mapAuthError(message) });
                    throw error;
                }
            },

            updateFirebasePassword: async (current, next) => {
                set({ authError: null });
                try {
                    await changePassword(current, next);
                } catch (error: unknown) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : 'Şifre güncellenemedi.';
                    set({ authError: mapAuthError(message) });
                    throw error;
                }
            },

            logout: async () => {
                if (get().authMode === 'firebase' && isAuthAvailable()) {
                    await firebaseSignOut();
                }
                setFinanceStorageUserId(null);
                await clearFinanceSession();
                set({ isAuthenticated: false, user: null });
            },

            clearAuthError: () => set({ authError: null }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                hasLocalPinSetup: state.hasLocalPinSetup,
                authMode: state.authMode,
            }),
        }
    )
);

export async function migrateLegacyLocalPin(): Promise<void> {
    const legacy = await AsyncStorage.getItem('auth-storage');
    if (!legacy) return;
    try {
        const parsed = JSON.parse(legacy) as { state?: { password?: string } };
        const pin = parsed?.state?.password;
        if (pin && !(await hasLocalPin())) {
            await saveLocalPin(pin);
            useAuthStore.setState({ hasLocalPinSetup: true });
        }
    } catch {
        // ignore
    }
}

function mapAuthError(message: string): string {
    if (message.includes('invalid-email')) return 'Geçersiz e-posta adresi.';
    if (message.includes('user-not-found')) return 'Kullanıcı bulunamadı.';
    if (message.includes('wrong-password') || message.includes('invalid-credential')) {
        return 'E-posta veya şifre hatalı.';
    }
    if (message.includes('email-already-in-use')) {
        return 'Bu e-posta zaten kayıtlı.';
    }
    if (message.includes('weak-password')) return 'Şifre tam 6 rakam olmalıdır.';
    if (message.includes('too-many-requests')) {
        return 'Çok fazla deneme. Lütfen sonra tekrar deneyin.';
    }
    return message;
}
