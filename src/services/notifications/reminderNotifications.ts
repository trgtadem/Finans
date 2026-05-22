import {
    parseISO,
    setHours,
    setMinutes,
    isBefore,
    addMonths,
    setDate,
    startOfDay,
    getDate,
} from 'date-fns';
import type { Reminder } from '../../store/useFinanceStore';
import { ensureNotificationHandler, getNotificationsModule } from './notificationsBridge';
import { normalizeReminderTime, shouldScheduleReminderNotification } from '../../utils/reminderHelpers';

export const DEFAULT_REMINDER_TIME = '09:00';

export type ReminderScheduleResult = {
    notificationId?: string;
    notificationIds?: string[];
};

function notificationContent(reminder: Reminder) {
    return {
        title: 'Finans Hatırlatıcı',
        body: reminder.note,
        data: {
            reminderId: reminder.id,
            type: 'reminder',
            repeatMonthly: reminder.repeatMonthly ?? false,
        },
        sound: true,
    };
}

export function getReminderDateTime(reminder: Pick<Reminder, 'date' | 'time'>): Date {
    const [hours, minutes] = normalizeReminderTime(reminder.time).split(':').map(Number);
    const base = parseISO(reminder.date);
    return setMinutes(setHours(base, hours), minutes);
}

async function scheduleOneShot(reminder: Reminder): Promise<string | null> {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return null;

    const triggerDate = getReminderDateTime(reminder);
    if (isBefore(triggerDate, new Date())) return null;

    try {
        return await Notifications.scheduleNotificationAsync({
            content: notificationContent(reminder),
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

async function scheduleMonthlyRepeating(reminder: Reminder): Promise<string | null> {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return null;

    const day = reminder.dayOfMonth ?? getDate(parseISO(reminder.date));
    const [hour, minute] = normalizeReminderTime(reminder.time).split(':').map(Number);

    try {
        return await Notifications.scheduleNotificationAsync({
            content: notificationContent(reminder),
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
                day,
                hour,
                minute,
                channelId: 'reminders',
            },
        });
    } catch {
        return null;
    }
}

/** Platform MONTHLY desteklemezse önümüzdeki 12 ay için tek seferlik DATE */
async function scheduleMonthlyFallbackDates(
    reminder: Reminder
): Promise<ReminderScheduleResult> {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return {};

    const day = reminder.dayOfMonth ?? getDate(parseISO(reminder.date));
    const [hour, minute] = normalizeReminderTime(reminder.time).split(':').map(Number);
    const ids: string[] = [];
    const now = new Date();
    let cursor = startOfDay(now);

    for (let i = 0; i < 12; i++) {
        const monthBase = i === 0 ? cursor : addMonths(cursor, 1);
        const lastDay = getDate(
            new Date(monthBase.getFullYear(), monthBase.getMonth() + 1, 0)
        );
        const safeDay = Math.min(day, lastDay);
        let triggerDate = setDate(startOfDay(monthBase), safeDay);
        triggerDate = setMinutes(setHours(triggerDate, hour), minute);

        if (!isBefore(triggerDate, now)) {
            try {
                const id = await Notifications.scheduleNotificationAsync({
                    content: notificationContent(reminder),
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: triggerDate,
                        channelId: 'reminders',
                    },
                });
                if (id) ids.push(id);
            } catch {
                // skip month
            }
        }
    }

    if (ids.length === 0) return {};
    return { notificationId: ids[0], notificationIds: ids };
}

export async function scheduleReminderNotification(
    reminder: Reminder
): Promise<ReminderScheduleResult> {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return {};

    await ensureNotificationHandler();

    if (!shouldScheduleReminderNotification(reminder)) {
        return {};
    }

    if (reminder.repeatMonthly) {
        const id = await scheduleMonthlyRepeating(reminder);
        if (id) return { notificationId: id };
        return scheduleMonthlyFallbackDates(reminder);
    }

    const id = await scheduleOneShot(reminder);
    return id ? { notificationId: id } : {};
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

export async function cancelReminderNotifications(reminder: Reminder): Promise<void> {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    const ids = new Set<string>();
    if (reminder.notificationId) ids.add(reminder.notificationId);
    (reminder.notificationIds ?? []).forEach((id) => ids.add(id));

    for (const id of ids) {
        await cancelReminderNotification(id);
    }

    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const entry of scheduled) {
            if (entry.content.data?.reminderId === reminder.id) {
                await Notifications.cancelScheduledNotificationAsync(entry.identifier);
            }
        }
    } catch {
        // ignore
    }
}

export async function rescheduleReminder(reminder: Reminder): Promise<ReminderScheduleResult> {
    await cancelReminderNotifications(reminder);
    return scheduleReminderNotification(reminder);
}

/** @deprecated Tek ID için uyumluluk */
export async function scheduleReminderNotificationLegacy(
    reminder: Reminder
): Promise<string | null> {
    const result = await scheduleReminderNotification(reminder);
    return result.notificationId ?? null;
}
