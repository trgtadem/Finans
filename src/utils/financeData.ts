import type { UserFinanceData } from '../services/firebase/userData';

export function hasFinanceContent(data: {
    transactions: unknown[];
    reminders: unknown[];
}): boolean {
    return data.transactions.length > 0 || data.reminders.length > 0;
}

export function isRemoteFinanceEmpty(data: UserFinanceData): boolean {
    return !hasFinanceContent(data);
}
