import type { Reminder } from '../store/useFinanceStore';

/** Bildirim kimlikleri cihaza özel; buluta gönderilmez. */
export function remindersForCloud(reminders: Reminder[]) {
    return reminders.map(({ notificationId: _nid, notificationIds: _nids, ...r }) => r);
}

export type CloudSnapshotPayload = {
    transactions: unknown[];
    reminders: ReturnType<typeof remindersForCloud>;
    incomeCategories: string[];
    expenseCategories: string[];
    monthlyExpenseBudget?: number | null;
};

export function cloudSnapshotKey(snapshot: CloudSnapshotPayload): string {
    return JSON.stringify(snapshot);
}

export function cloudSnapshotKeyFromFinanceData(data: {
    transactions: unknown[];
    reminders: Reminder[];
    incomeCategories: string[];
    expenseCategories: string[];
    monthlyExpenseBudget?: number | null;
}): string {
    return cloudSnapshotKey({
        transactions: data.transactions,
        reminders: remindersForCloud(
            data.reminders.map((r) => ({ ...r, time: r.time ?? '09:00' }))
        ),
        incomeCategories: data.incomeCategories,
        expenseCategories: data.expenseCategories,
        monthlyExpenseBudget: data.monthlyExpenseBudget ?? null,
    });
}
