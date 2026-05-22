import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createFinancePersistStorage } from './financeStorage';
import { remindersForCloud } from '../utils/cloudSnapshot';
import { generateId } from '../utils/id';
import { enqueueCloudDelta } from '../services/sync/cloudSync';

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
    monthlyExpenseBudget: number | null;
    isCloudDataReady: boolean;
    cloudUpdatedAt: string | null;
    syncError: string | null;
    isSyncing: boolean;
    lastSyncAt: string | null;
    hasPendingCloudSync: boolean;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    updateTransaction: (id: string, patch: Partial<Omit<Transaction, 'id'>>) => void;
    deleteTransaction: (id: string) => void;
    addReminder: (reminder: Omit<Reminder, 'id'>) => string;
    updateReminder: (id: string, patch: Partial<Omit<Reminder, 'id'>>) => void;
    updateReminderNotificationId: (id: string, notificationId: string | undefined) => void;
    applyReminderNotificationIds: (
        updates: Array<{ id: string; notificationId?: string }>
    ) => void;
    deleteReminder: (id: string) => Reminder | undefined;
    setReminders: (reminders: Reminder[]) => void;
    setMonthlyExpenseBudget: (amount: number | null) => void;
    hydrateFromCloud: (
        data: {
            transactions: Transaction[];
            reminders: Reminder[];
            incomeCategories: string[];
            expenseCategories: string[];
            monthlyExpenseBudget?: number | null;
        },
        updatedAt?: string
    ) => void;
    getCloudSnapshot: () => {
        transactions: Transaction[];
        reminders: Reminder[];
        incomeCategories: string[];
        expenseCategories: string[];
        monthlyExpenseBudget: number | null;
    };
    markDataDirty: () => void;
    clearPendingCloudSync: () => void;
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

function settingsPatchFromState(state: FinanceState) {
    return {
        incomeCategories: state.incomeCategories,
        expenseCategories: state.expenseCategories,
        monthlyExpenseBudget: state.monthlyExpenseBudget,
    };
}

export const useFinanceStore = create<FinanceState>()(
    persist(
        (set, get) => ({
            transactions: [],
            reminders: [],
            incomeCategories: DEFAULT_INCOME_CATEGORIES,
            expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
            monthlyExpenseBudget: null,
            isCloudDataReady: false,
            cloudUpdatedAt: null,
            syncError: null,
            isSyncing: false,
            lastSyncAt: null,
            hasPendingCloudSync: false,

            markDataDirty: () => set({ hasPendingCloudSync: true }),
            clearPendingCloudSync: () => set({ hasPendingCloudSync: false }),

            addTransaction: (transaction) => {
                const tx: Transaction = {
                    ...transaction,
                    amount: Math.min(transaction.amount, 9999999999),
                    id: generateId(),
                };
                set((state) => ({
                    transactions: [...state.transactions, tx].sort(
                        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                    ),
                    hasPendingCloudSync: true,
                }));
                enqueueCloudDelta({ type: 'upsertTransaction', tx });
            },

            deleteTransaction: (id) => {
                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id),
                    hasPendingCloudSync: true,
                }));
                enqueueCloudDelta({ type: 'deleteTransaction', id });
            },

            updateTransaction: (id, patch) => {
                let updated: Transaction | undefined;
                set((state) => {
                    const transactions = state.transactions
                        .map((t) => {
                            if (t.id !== id) return t;
                            updated = {
                                ...t,
                                ...patch,
                                amount:
                                    patch.amount != null
                                        ? Math.min(patch.amount, 9999999999)
                                        : t.amount,
                            };
                            return updated;
                        })
                        .sort(
                            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                        );
                    return { transactions, hasPendingCloudSync: true };
                });
                if (updated) {
                    enqueueCloudDelta({ type: 'upsertTransaction', tx: updated });
                }
            },

            addReminder: (reminder) => {
                const id = generateId();
                const full: Reminder = { ...reminder, id };
                set((state) => ({
                    reminders: [...state.reminders, full],
                    hasPendingCloudSync: true,
                }));
                enqueueCloudDelta({
                    type: 'upsertReminder',
                    reminder: remindersForCloud([full])[0],
                });
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

            updateReminder: (id, patch) => {
                let updated: Reminder | undefined;
                set((state) => ({
                    reminders: state.reminders.map((r) => {
                        if (r.id !== id) return r;
                        updated = { ...r, ...patch };
                        return updated;
                    }),
                    hasPendingCloudSync: true,
                }));
                if (updated) {
                    enqueueCloudDelta({
                        type: 'upsertReminder',
                        reminder: remindersForCloud([updated])[0],
                    });
                }
            },

            deleteReminder: (id) => {
                const existing = get().reminders.find((r) => r.id === id);
                set((state) => ({
                    reminders: state.reminders.filter((r) => r.id !== id),
                    hasPendingCloudSync: true,
                }));
                enqueueCloudDelta({ type: 'deleteReminder', id });
                return existing;
            },

            setReminders: (reminders) =>
                set({ reminders, hasPendingCloudSync: true }),

            setMonthlyExpenseBudget: (amount) => {
                const monthlyExpenseBudget =
                    amount != null && amount > 0 ? Math.min(amount, 9999999999) : null;
                set({ monthlyExpenseBudget, hasPendingCloudSync: true });
                const s = get();
                enqueueCloudDelta({
                    type: 'patchSettings',
                    patch: settingsPatchFromState(s),
                });
            },

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
                    monthlyExpenseBudget:
                        data.monthlyExpenseBudget ?? get().monthlyExpenseBudget,
                    cloudUpdatedAt: updatedAt ?? get().cloudUpdatedAt,
                    hasPendingCloudSync: false,
                });
            },

            getCloudSnapshot: () => {
                const {
                    transactions,
                    reminders,
                    incomeCategories,
                    expenseCategories,
                    monthlyExpenseBudget,
                } = get();
                return {
                    transactions,
                    reminders: remindersForCloud(reminders),
                    incomeCategories,
                    expenseCategories,
                    monthlyExpenseBudget,
                };
            },

            setCloudDataReady: (ready) => set({ isCloudDataReady: ready }),
            setSyncError: (message) => set({ syncError: message, isSyncing: false }),
            clearSyncError: () => set({ syncError: null }),
            setIsSyncing: (syncing) => set({ isSyncing: syncing }),
            setLastSyncAt: (at) => set({ lastSyncAt: at }),
            setCloudUpdatedAt: (at) => set({ cloudUpdatedAt: at }),

            addCategory: (type, name) => {
                set((state) => {
                    const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
                    if (state[key].includes(name)) return state;
                    return { [key]: [...state[key], name], hasPendingCloudSync: true };
                });
                enqueueCloudDelta({
                    type: 'patchSettings',
                    patch: settingsPatchFromState(get()),
                });
            },

            deleteCategory: (type, name) => {
                set((state) => {
                    const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
                    return {
                        [key]: state[key].filter((c) => c !== name),
                        hasPendingCloudSync: true,
                    };
                });
                enqueueCloudDelta({
                    type: 'patchSettings',
                    patch: settingsPatchFromState(get()),
                });
            },

            resetData: () =>
                set({
                    transactions: [],
                    reminders: [],
                    incomeCategories: DEFAULT_INCOME_CATEGORIES,
                    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
                    monthlyExpenseBudget: null,
                    cloudUpdatedAt: null,
                    syncError: null,
                    isSyncing: false,
                    hasPendingCloudSync: false,
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
            version: 4,
            partialize: (state) => ({
                transactions: state.transactions,
                reminders: state.reminders,
                incomeCategories: state.incomeCategories,
                expenseCategories: state.expenseCategories,
                monthlyExpenseBudget: state.monthlyExpenseBudget,
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
                        monthlyExpenseBudget: null,
                    };
                }
                if (version < 4) {
                    return {
                        ...migrated,
                        monthlyExpenseBudget: migrated.monthlyExpenseBudget ?? null,
                    };
                }
                return migrated;
            },
        }
    )
);
