import React, { useState, useMemo } from 'react';
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
    rescheduleReminder,
    DEFAULT_REMINDER_TIME,
} from '../../src/services/notifications/reminderNotifications';
import { feedback } from '../../src/components/feedback';
import { ReminderForm } from '../../src/components/ReminderForm';
import { formatRepeatLabel } from '../../src/utils/reminderHelpers';

export default function EditReminderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id: string }>();
    const { reminders, updateReminder, applyReminderSchedules } = useFinanceStore();
    const { theme } = useAppTheme();

    const existing = useMemo(
        () => reminders.find((r) => r.id === params.id),
        [reminders, params.id]
    );

    const [note, setNote] = useState(existing?.note ?? '');
    const [selectedTime, setSelectedTime] = useState(existing?.time ?? DEFAULT_REMINDER_TIME);
    const [repeatMonthly, setRepeatMonthly] = useState(existing?.repeatMonthly ?? false);
    const [isSaving, setIsSaving] = useState(false);

    if (!existing) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Text style={[styles.missing, { color: theme.textSecondary }]}>
                    Hatırlatıcı bulunamadı.
                </Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: theme.primary }}>Geri dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleSave = async () => {
        if (!note.trim()) {
            feedback.error('Lütfen bir not girin.');
            return;
        }

        setIsSaving(true);
        try {
            updateReminder(existing.id, {
                note: note.trim(),
                time: selectedTime,
                repeatMonthly,
            });

            const updated = useFinanceStore.getState().reminders.find((r) => r.id === existing.id);
            if (updated) {
                const schedule = await rescheduleReminder(updated);
                applyReminderSchedules([{ id: existing.id, ...schedule }]);
            }

            feedback.success('Hatırlatıcı güncellendi.');
            router.back();
        } catch {
            feedback.error('Hatırlatıcı kaydedilemedi.');
        } finally {
            setIsSaving(false);
        }
    };

    const dateLabel = repeatMonthly
        ? formatRepeatLabel({
              ...existing,
              repeatMonthly: true,
              time: selectedTime,
          })
        : format(parseISO(existing.date), 'd MMMM yyyy', { locale: tr });

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Hatırlatıcıyı Düzenle</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.dateBadge, { backgroundColor: theme.surface }]}>
                    <Bell size={20} color={theme.secondary} />
                    <Text style={[styles.dateText, { color: theme.text }]}>{dateLabel}</Text>
                </View>

                <ReminderForm
                    note={note}
                    onNoteChange={setNote}
                    time={selectedTime}
                    onTimeChange={setSelectedTime}
                    repeatMonthly={repeatMonthly}
                    onRepeatMonthlyChange={setRepeatMonthly}
                    date={existing.date}
                />

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                    onPress={() => handleSave()}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Check size={22} color="#FFF" />
                            <Text style={styles.saveBtnText}>Kaydet</Text>
                        </>
                    )}
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
        paddingTop: 56,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    backBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: Spacing.lg, gap: Spacing.lg },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radius.md,
    },
    dateText: { fontSize: 16, fontWeight: '600', flex: 1 },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        height: 50,
        borderRadius: Radius.md,
        marginTop: Spacing.md,
    },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    missing: { textAlign: 'center', margin: Spacing.xl },
});
