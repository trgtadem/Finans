import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'card';

export interface Transaction {
    id: string;
    type: TransactionType;
    method: PaymentMethod;
    amount: number;
    category: string;
    note: string;
    date: string; // ISO string
}

interface FinanceState {
    transactions: Transaction[];
    incomeCategories: string[];
    expenseCategories: string[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    deleteTransaction: (id: string) => void;
    addCategory: (type: TransactionType, name: string) => void;
    deleteCategory: (type: TransactionType, name: string) => void;
    getTotalBalance: () => number;
}

export const useFinanceStore = create<FinanceState>()(
    persist(
        (set, get) => ({
            transactions: [],
            incomeCategories: ['Maaş', 'Satış', 'Bonus', 'Faiz', 'Diğer'],
            expenseCategories: ['Gıda', 'Ulaşım', 'Eğlence', 'Kira', 'Fatura', 'Genel'],

            addTransaction: (transaction) => set((state) => ({
                transactions: [
                    ...state.transactions,
                    {
                        ...transaction,
                        amount: Math.min(transaction.amount, 9999999999),
                        id: Math.random().toString(36).substring(7)
                    }
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            })),

            deleteTransaction: (id) => set((state) => ({
                transactions: state.transactions.filter(t => t.id !== id)
            })),

            addCategory: (type, name) => set((state) => {
                const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
                if (state[key].includes(name)) return state;
                return { [key]: [...state[key], name] };
            }),

            deleteCategory: (type, name) => set((state) => {
                const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
                return { [key]: state[key].filter(c => c !== name) };
            }),

            getTotalBalance: () => {
                const { transactions } = get();
                return transactions.reduce((acc, t) => {
                    return t.type === 'income' ? acc + t.amount : acc - t.amount;
                }, 0);
            },
        }),
        {
            name: 'finance-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
