import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Reminder, Transaction } from '../store/useFinanceStore';

export function todayKey(date = new Date()): string {
    return format(date, 'yyyy-MM-dd');
}

export function getTodayReminders(reminders: Reminder[], date = new Date()): Reminder[] {
    const key = todayKey(date);
    return reminders
        .filter((r) => r.date === key)
        .sort((a, b) => a.time.localeCompare(b.time));
}

export interface MonthlySummary {
    monthLabel: string;
    income: number;
    expense: number;
    net: number;
    budget: number | null;
    budgetRemaining: number | null;
    budgetUsedPercent: number | null;
}

export function getMonthlySummary(
    transactions: Transaction[],
    monthlyExpenseBudget: number | null,
    referenceDate = new Date()
): MonthlySummary {
    const start = startOfMonth(referenceDate);
    const end = endOfMonth(referenceDate);
    const monthLabel = format(referenceDate, 'MMMM yyyy', { locale: tr });

    let income = 0;
    let expense = 0;

    for (const t of transactions) {
        const d = parseISO(t.date);
        if (!isWithinInterval(d, { start, end })) continue;
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
    }

    const net = income - expense;
    const budget = monthlyExpenseBudget && monthlyExpenseBudget > 0 ? monthlyExpenseBudget : null;
    const budgetRemaining = budget != null ? budget - expense : null;
    const budgetUsedPercent =
        budget != null ? Math.min(100, Math.round((expense / budget) * 100)) : null;

    return {
        monthLabel,
        income,
        expense,
        net,
        budget,
        budgetRemaining,
        budgetUsedPercent,
    };
}
