import { parseISO, setHours, setMinutes, isBefore } from 'date-fns';
import type { Reminder } from '../../store/useFinanceStore';
import { ensureNotificationHandler, getNotificationsModule } from './notificationsBridge';

export const DEFAULT_REMINDER_TIME = '09:00';

export function getReminderDateTime(reminder: Pick<Reminder, 'date' | 'time'>): Date {
    const [hours, minutes] = (reminder.time ?? DEFAULT_REMINDER_TIME).split(':').map(Number);
    const base = parseISO(reminder.date);
    return setMinutes(setHours(base, hours), minutes);
}

export async function scheduleReminderNotification(
    reminder: Reminder
): Promise<string | null> {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return null;

    await ensureNotificationHandler();

    const triggerDate = getReminderDateTime(reminder);
    if (isBefore(triggerDate, new Date())) {
        return null;
    }

    try {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Finans Hatırlatıcı',
                body: reminder.note,
                data: { reminderId: reminder.id, type: 'reminder' },
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
                channelId: 'reminders',
            },
        });
    } catch {
        return null;
    }
}

export async function cancelReminderNotification(
    notificationId: string | undefined
): Promise<void> {
    if (!notificationId) return;
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
        // ignore
    }
}
