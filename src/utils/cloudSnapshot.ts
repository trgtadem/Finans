import type { Reminder } from '../store/useFinanceStore';

/** Bildirim kimlikleri cihaza özel; buluta gönderilmez. */
export function remindersForCloud(reminders: Reminder[]) {
    return reminders.map(({ notificationId: _nid, ...r }) => r);
}

export function cloudSnapshotKey(snapshot: {
    transactions: unknown[];
    reminders: ReturnType<typeof remindersForCloud>;
    incomeCategories: string[];
    expenseCategories: string[];
}): string {
    return JSON.stringify(snapshot);
}
