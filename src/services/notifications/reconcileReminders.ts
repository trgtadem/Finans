import type { Reminder } from '../../store/useFinanceStore';
import { getNotificationsModule } from './notificationsBridge';
import {
    scheduleReminderNotification,
    cancelReminderNotification,
} from './reminderNotifications';

/** OS bildirimlerini hatırlatıcı listesine göre yeniler; store / Firestore güncellemez. */
export async function syncLocalReminderNotifications(reminders: Reminder[]): Promise<void> {
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
        return;
    }

    for (const reminder of reminders) {
        await cancelReminderNotification(reminder.notificationId);
        await scheduleReminderNotification({
            ...reminder,
            notificationId: undefined,
        });
    }
}
