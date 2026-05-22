import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { Spacing, Radius } from '../../src/theme';
import { Bell, Check, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAppTheme } from '../../src/theme/useAppTheme';
import {
    scheduleReminderNotification,
    DEFAULT_REMINDER_TIME,
} from '../../src/services/notifications/reminderNotifications';
import { feedback } from '../../src/components/feedback';
import { ReminderForm } from '../../src/components/ReminderForm';
import { formatRepeatLabel } from '../../src/utils/reminderHelpers';

export default function AddReminderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ date: string }>();
    const { addReminder, applyReminderSchedules } = useFinanceStore();
    const { theme } = useAppTheme();

    const [note, setNote] = useState('');
    const [selectedTime, setSelectedTime] = useState(DEFAULT_REMINDER_TIME);
    const [repeatMonthly, setRepeatMonthly] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const reminderDate = params.date;

    const handleSave = async () => {
        if (!note.trim()) {
            feedback.error('Lütfen bir not girin.');
            return;
        }

        setIsSaving(true);

        try {
            const reminderId = addReminder({
                note: note.trim(),
                date: reminderDate,
                time: selectedTime,
                repeatMonthly,
            });

            const reminder = useFinanceStore
                .getState()
                .reminders.find((r) => r.id === reminderId);

            if (reminder) {
                const schedule = await scheduleReminderNotification(reminder);
                applyReminderSchedules([{ id: reminderId, ...schedule }]);
            }

            feedback.success('Hatırlatıcı kaydedildi.');
            router.back();
        } catch {
            feedback.warning('Hatırlatıcı kaydedildi; bildirim planlanamadı. İzinleri kontrol edin.');
            router.back();
        } finally {
            setIsSaving(false);
        }
    };

    const dateLabel = repeatMonthly
        ? formatRepeatLabel({
              id: '',
              note: '',
              date: reminderDate,
              time: selectedTime,
              repeatMonthly: true,
              dayOfMonth: parseISO(reminderDate).getDate(),
          })
        : format(parseISO(reminderDate), 'd MMMM yyyy', { locale: tr });

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Hatırlatıcı Ekle</Text>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <ActivityIndicator color={theme.primary} />
                    ) : (
                        <Check size={24} color={theme.primary} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.dateInfo}>
                    <Bell size={20} color={theme.primary} />
                    <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                        {repeatMonthly ? `${dateLabel} — ${selectedTime}` : `${dateLabel} için hatırlatıcı`}
                    </Text>
                </View>

                <ReminderForm
                    note={note}
                    onNoteChange={setNote}
                    time={selectedTime}
                    onTimeChange={setSelectedTime}
                    repeatMonthly={repeatMonthly}
                    onRepeatMonthlyChange={setRepeatMonthly}
                    date={reminderDate}
                />

                <TouchableOpacity
                    style={[
                        styles.mainButton,
                        { backgroundColor: theme.primary, opacity: isSaving ? 0.6 : 1 },
                    ]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Text style={styles.mainButtonText}>
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet ve Bildirim Kur'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    saveBtn: { padding: 4, minWidth: 32, alignItems: 'center' },
    scrollContent: { padding: Spacing.lg },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    dateText: { fontSize: 16, flex: 1 },
    mainButton: {
        height: 55,
        borderRadius: Radius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.md,
        elevation: 3,
    },
    mainButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
