import type { Reminder } from '../../store/useFinanceStore';
import { getNotificationsModule } from './notificationsBridge';
import {
    scheduleReminderNotification,
    cancelReminderNotifications,
    type ReminderScheduleResult,
} from './reminderNotifications';
import { shouldScheduleReminderNotification } from '../../utils/reminderHelpers';

export type ReminderNotificationUpdate = {
    id: string;
} & ReminderScheduleResult;

async function cancelAllReminderTypeNotifications(): Promise<void> {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const entry of scheduled) {
            if (entry.content.data?.type === 'reminder') {
                await Notifications.cancelScheduledNotificationAsync(entry.identifier);
            }
        }
    } catch {
        // ignore
    }
}

/** OS bildirimlerini hatırlatıcı listesine göre yeniler; güncellenmiş ID listesini döner. */
export async function syncLocalReminderNotifications(
    reminders: Reminder[]
): Promise<ReminderNotificationUpdate[]> {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return [];

    await cancelAllReminderTypeNotifications();

    const updates: ReminderNotificationUpdate[] = [];

    for (const reminder of reminders) {
        await cancelReminderNotifications(reminder);

        if (!shouldScheduleReminderNotification(reminder)) {
            updates.push({ id: reminder.id, notificationId: undefined, notificationIds: undefined });
            continue;
        }

        const result = await scheduleReminderNotification(reminder);
        updates.push({ id: reminder.id, ...result });
    }

    return updates;
}
