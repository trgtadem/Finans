import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createFinancePersistStorage } from './financeStorage';
import { remindersForCloud } from '../utils/cloudSnapshot';

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'card';

export interface Transaction {
    id: string;
    type: TransactionType;
    method: PaymentMethod;
    amount: number;
    category: string;
    note: string;
    date: string;
}

export interface Reminder {
    id: string;
    note: string;
    date: string;
    time: string;
    notificationId?: string;
}

const DEFAULT_INCOME_CATEGORIES = ['Maaş', 'Satış', 'Bonus', 'Faiz', 'Diğer'];
const DEFAULT_EXPENSE_CATEGORIES = ['Gıda', 'Ulaşım', 'Eğlence', 'Kira', 'Fatura', 'Genel'];

interface FinanceState {
    transactions: Transaction[];
    reminders: Reminder[];
    incomeCategories: string[];
    expenseCategories: string[];
    isCloudDataReady: boolean;
    cloudUpdatedAt: string | null;
    syncError: string | null;
    isSyncing: boolean;
    lastSyncAt: string | null;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    deleteTransaction: (id: string) => void;
    addReminder: (reminder: Omit<Reminder, 'id'>) => string;
    updateReminderNotificationId: (id: string, notificationId: string | undefined) => void;
    applyReminderNotificationIds: (
        updates: Array<{ id: string; notificationId?: string }>
    ) => void;
    deleteReminder: (id: string) => Reminder | undefined;
    setReminders: (reminders: Reminder[]) => void;
    hydrateFromCloud: (
        data: {
            transactions: Transaction[];
            reminders: Reminder[];
            incomeCategories: string[];
            expenseCategories: string[];
        },
        updatedAt?: string
    ) => void;
    getCloudSnapshot: () => {
        transactions: Transaction[];
        reminders: Reminder[];
        incomeCategories: string[];
        expenseCategories: string[];
    };
    setCloudDataReady: (ready: boolean) => void;
    setSyncError: (message: string) => void;
    clearSyncError: () => void;
    setIsSyncing: (syncing: boolean) => void;
    setLastSyncAt: (at: string) => void;
    setCloudUpdatedAt: (at: string) => void;
    addCategory: (type: TransactionType, name: string) => void;
    deleteCategory: (type: TransactionType, name: string) => void;
    resetData: () => void;
    getTotalBalance: () => number;
}

function generateId() {
    return Math.random().toString(36).substring(7);
}

export const useFinanceStore = create<FinanceState>()(
    persist(
        (set, get) => ({
            transactions: [],
            reminders: [],
            incomeCategories: DEFAULT_INCOME_CATEGORIES,
            expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
            isCloudDataReady: false,
            cloudUpdatedAt: null,
            syncError: null,
            isSyncing: false,
            lastSyncAt: null,

            addTransaction: (transaction) =>
                set((state) => ({
                    transactions: [
                        ...state.transactions,
                        {
                            ...transaction,
                            amount: Math.min(transaction.amount, 9999999999),
                            id: generateId(),
                        },
                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                })),

            deleteTransaction: (id) =>
                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id),
                })),

            addReminder: (reminder) => {
                const id = generateId();
                set((state) => ({
                    reminders: [...state.reminders, { ...reminder, id }],
                }));
                return id;
            },

            updateReminderNotificationId: (id, notificationId) =>
                set((state) => ({
                    reminders: state.reminders.map((r) =>
                        r.id === id ? { ...r, notificationId } : r
                    ),
                })),

            applyReminderNotificationIds: (updates) =>
                set((state) => {
                    if (updates.length === 0) return state;
                    const map = new Map(updates.map((u) => [u.id, u.notificationId]));
                    return {
                        reminders: state.reminders.map((r) =>
                            map.has(r.id) ? { ...r, notificationId: map.get(r.id) } : r
                        ),
                    };
                }),

            deleteReminder: (id) => {
                const existing = get().reminders.find((r) => r.id === id);
                set((state) => ({
                    reminders: state.reminders.filter((r) => r.id !== id),
                }));
                return existing;
            },

            setReminders: (reminders) => set({ reminders }),

            hydrateFromCloud: (data, updatedAt) => {
                const localNotifById = new Map(
                    get().reminders.map((r) => [r.id, r.notificationId])
                );
                set({
                    transactions: data.transactions,
                    reminders: data.reminders.map((r) => ({
                        ...r,
                        notificationId: localNotifById.get(r.id),
                    })),
                    incomeCategories: data.incomeCategories,
                    expenseCategories: data.expenseCategories,
                    cloudUpdatedAt: updatedAt ?? get().cloudUpdatedAt,
                });
            },

            getCloudSnapshot: () => {
                const { transactions, reminders, incomeCategories, expenseCategories } = get();
                return {
                    transactions,
                    reminders: remindersForCloud(reminders),
                    incomeCategories,
                    expenseCategories,
                };
            },

            setCloudDataReady: (ready) => set({ isCloudDataReady: ready }),
            setSyncError: (message) => set({ syncError: message, isSyncing: false }),
            clearSyncError: () => set({ syncError: null }),
            setIsSyncing: (syncing) => set({ isSyncing: syncing }),
            setLastSyncAt: (at) => set({ lastSyncAt: at }),
            setCloudUpdatedAt: (at) => set({ cloudUpdatedAt: at }),

            addCategory: (type, name) =>
                set((state) => {
                    const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
                    if (state[key].includes(name)) return state;
                    return { [key]: [...state[key], name] };
                }),

            deleteCategory: (type, name) =>
                set((state) => {
                    const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
                    return { [key]: state[key].filter((c) => c !== name) };
                }),

            resetData: () =>
                set({
                    transactions: [],
                    reminders: [],
                    incomeCategories: DEFAULT_INCOME_CATEGORIES,
                    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
                    cloudUpdatedAt: null,
                    syncError: null,
                    isSyncing: false,
                }),

            getTotalBalance: () => {
                const { transactions } = get();
                return transactions.reduce(
                    (acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount),
                    0
                );
            },
        }),
        {
            name: 'finance-storage',
            storage: createJSONStorage(() => createFinancePersistStorage()),
            version: 3,
            partialize: (state) => ({
                transactions: state.transactions,
                reminders: state.reminders,
                incomeCategories: state.incomeCategories,
                expenseCategories: state.expenseCategories,
                cloudUpdatedAt: state.cloudUpdatedAt,
                lastSyncAt: state.lastSyncAt,
            }),
            migrate: (persisted: unknown, version) => {
                const state = persisted as Partial<FinanceState>;
                if (!state) return persisted;
                const migrated = {
                    ...state,
                    reminders: (state.reminders ?? []).map((r) => ({
                        ...r,
                        time: r.time ?? '09:00',
                    })),
                };
                if (version < 3) {
                    return {
                        ...migrated,
                        cloudUpdatedAt: migrated.cloudUpdatedAt ?? null,
                        lastSyncAt: migrated.lastSyncAt ?? null,
                    };
                }
                return migrated;
            },
        }
    )
);
