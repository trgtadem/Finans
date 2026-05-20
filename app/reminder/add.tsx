import React, { useState } from 'react';
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
    DEFAULT_REMINDER_TIME,
} from '../../src/services/notifications/reminderNotifications';
import { feedback } from '../../src/components/feedback';

const TIME_OPTIONS = ['08:00', '09:00', '12:00', '18:00', '20:00'];

export default function AddReminderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ date: string }>();
    const { addReminder, updateReminderNotificationId } = useFinanceStore();
    const { theme } = useAppTheme();

    const [note, setNote] = useState('');
    const [selectedTime, setSelectedTime] = useState(DEFAULT_REMINDER_TIME);
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
            });

            const reminder = {
                id: reminderId,
                note: note.trim(),
                date: reminderDate,
                time: selectedTime,
                notificationId: undefined as string | undefined,
            };

            const notificationId = await scheduleReminderNotification(reminder);
            if (notificationId) {
                updateReminderNotificationId(reminderId, notificationId);
                reminder.notificationId = notificationId;
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
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={isSaving}
                >
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
                        {format(parseISO(reminderDate), 'd MMMM yyyy', { locale: tr })} için hatırlatıcı
                    </Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Hatırlatılacak Not</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Örn: Kira ödemesi yapılacak"
                            placeholderTextColor={theme.textSecondary}
                            multiline
                            autoFocus
                            value={note}
                            onChangeText={setNote}
                            maxLength={100}
                        />
                    </View>
                    <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                        {note.length}/100
                    </Text>
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.timeLabelRow}>
                        <Clock size={16} color={theme.textSecondary} />
                        <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 0 }]}>
                            Bildirim Saati
                        </Text>
                    </View>
                    <View style={styles.timeOptions}>
                        {TIME_OPTIONS.map((time) => (
                            <TouchableOpacity
                                key={time}
                                style={[
                                    styles.timeChip,
                                    {
                                        backgroundColor:
                                            selectedTime === time
                                                ? theme.primary
                                                : theme.surface,
                                    },
                                ]}
                                onPress={() => setSelectedTime(time)}
                            >
                                <Text
                                    style={[
                                        styles.timeChipText,
                                        {
                                            color:
                                                selectedTime === time
                                                    ? '#FFF'
                                                    : theme.text,
                                        },
                                    ]}
                                >
                                    {time}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

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
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveBtn: {
        padding: 4,
        minWidth: 32,
        alignItems: 'center',
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    dateText: {
        fontSize: 16,
    },
    inputGroup: {
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: Spacing.sm,
        marginLeft: 4,
    },
    timeLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    timeOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    timeChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.lg,
    },
    timeChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    inputWrapper: {
        borderRadius: Radius.lg,
        padding: Spacing.md,
        minHeight: 120,
        elevation: 2,
    },
    input: {
        fontSize: 16,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 4,
        marginRight: 4,
    },
    mainButton: {
        height: 55,
        borderRadius: Radius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.md,
        elevation: 3,
    },
    mainButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
