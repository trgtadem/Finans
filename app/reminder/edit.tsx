import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { Spacing, Radius } from '../../src/theme';
import { Bell, Check, ArrowLeft, Clock } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAppTheme } from '../../src/theme/useAppTheme';
import {
    scheduleReminderNotification,
    cancelReminderNotification,
    DEFAULT_REMINDER_TIME,
} from '../../src/services/notifications/reminderNotifications';
import { feedback } from '../../src/components/feedback';

const TIME_OPTIONS = ['08:00', '09:00', '12:00', '18:00', '20:00'];

export default function EditReminderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id: string }>();
    const { reminders, updateReminder, updateReminderNotificationId } = useFinanceStore();
    const { theme } = useAppTheme();

    const existing = useMemo(
        () => reminders.find((r) => r.id === params.id),
        [reminders, params.id]
    );

    const [note, setNote] = useState(existing?.note ?? '');
    const [selectedTime, setSelectedTime] = useState(existing?.time ?? DEFAULT_REMINDER_TIME);
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
            if (existing.notificationId) {
                await cancelReminderNotification(existing.notificationId);
            }

            updateReminder(existing.id, {
                note: note.trim(),
                time: selectedTime,
            });

            const notificationId = await scheduleReminderNotification({
                id: existing.id,
                note: note.trim(),
                date: existing.date,
                time: selectedTime,
            });
            updateReminderNotificationId(existing.id, notificationId ?? undefined);

            feedback.success('Hatırlatıcı güncellendi.');
            router.back();
        } catch {
            feedback.error('Hatırlatıcı kaydedilemedi.');
        } finally {
            setIsSaving(false);
        }
    };

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
                    <Text style={[styles.dateText, { color: theme.text }]}>
                        {format(parseISO(existing.date), 'd MMMM yyyy', { locale: tr })}
                    </Text>
                </View>

                <Text style={[styles.label, { color: theme.textSecondary }]}>Not</Text>
                <TextInput
                    style={[
                        styles.input,
                        { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                    placeholder="Hatırlatma notu"
                    placeholderTextColor={theme.textSecondary}
                    value={note}
                    onChangeText={setNote}
                    multiline
                />

                <View style={styles.timeHeader}>
                    <Clock size={18} color={theme.textSecondary} />
                    <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 0 }]}>
                        Saat
                    </Text>
                </View>
                <View style={styles.timeRow}>
                    {TIME_OPTIONS.map((time) => (
                        <TouchableOpacity
                            key={time}
                            style={[
                                styles.timeChip,
                                {
                                    borderColor: theme.border,
                                    backgroundColor:
                                        selectedTime === time ? theme.primary : theme.surface,
                                },
                            ]}
                            onPress={() => setSelectedTime(time)}
                        >
                            <Text
                                style={{
                                    color: selectedTime === time ? '#FFF' : theme.text,
                                    fontWeight: '600',
                                }}
                            >
                                {time}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

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
    content: { padding: Spacing.lg, gap: Spacing.md },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radius.md,
    },
    dateText: { fontSize: 16, fontWeight: '600' },
    label: { fontSize: 14, marginBottom: Spacing.xs },
    input: {
        minHeight: 80,
        borderWidth: 1,
        borderRadius: Radius.md,
        padding: Spacing.md,
        fontSize: 16,
        textAlignVertical: 'top',
    },
    timeHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    timeChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: 20,
        borderWidth: 1,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        height: 50,
        borderRadius: Radius.md,
        marginTop: Spacing.lg,
    },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    missing: { textAlign: 'center', margin: Spacing.xl },
});
