import {
    format,
    getDate,
    getDaysInMonth,
    parseISO,
    setDate,
    startOfMonth,
    isBefore,
} from 'date-fns';
import type { Reminder } from '../store/useFinanceStore';

export function normalizeReminderTime(time?: string): string {
    if (!time || !/^\d{1,2}:\d{2}$/.test(time)) return '09:00';
    const [h, m] = time.split(':').map(Number);
    return `${String(Math.min(23, Math.max(0, h))).padStart(2, '0')}:${String(Math.min(59, Math.max(0, m))).padStart(2, '0')}`;
}

export function getDayOfMonthFromDate(dateStr: string): number {
    return getDate(parseISO(dateStr));
}

export function enrichReminderInput(
    input: Omit<Reminder, 'id'> & Partial<Pick<Reminder, 'dayOfMonth'>>
): Omit<Reminder, 'id'> {
    const time = normalizeReminderTime(input.time);
    const repeatMonthly = Boolean(input.repeatMonthly);
    const dayOfMonth = repeatMonthly
        ? (input.dayOfMonth ?? getDayOfMonthFromDate(input.date))
        : undefined;
    return {
        ...input,
        time,
        repeatMonthly,
        dayOfMonth,
    };
}

/** Düzenli hatırlatıcı bu takvim gününde mi? */
export function reminderMatchesDate(reminder: Reminder, dateKey: string): boolean {
    if (reminder.repeatMonthly && reminder.dayOfMonth != null) {
        return getDate(parseISO(dateKey)) === reminder.dayOfMonth;
    }
    return reminder.date === dateKey;
}

export function shouldScheduleReminderNotification(reminder: Reminder): boolean {
    if (reminder.repeatMonthly && reminder.dayOfMonth != null) {
        return true;
    }
    const [hours, minutes] = normalizeReminderTime(reminder.time).split(':').map(Number);
    const base = parseISO(reminder.date);
    base.setHours(hours, minutes, 0, 0);
    return !isBefore(base, new Date());
}

/** Ayın `dayOfMonth` günü için yyyy-MM-dd (Şubat vb. kısa aylarda son geçerli gün). */
export function reminderDateKeyForMonth(monthAnchor: string, dayOfMonth: number): string {
    const anchor =
        monthAnchor.length === 7 ? parseISO(`${monthAnchor}-01`) : parseISO(monthAnchor);
    const start = startOfMonth(anchor);
    const safeDay = Math.min(dayOfMonth, getDaysInMonth(start));
    return format(setDate(start, safeDay), 'yyyy-MM-dd');
}

export function formatRepeatLabel(reminder: Reminder): string | null {
    if (!reminder.repeatMonthly || reminder.dayOfMonth == null) return null;
    return `Her ayın ${reminder.dayOfMonth}. günü`;
}
