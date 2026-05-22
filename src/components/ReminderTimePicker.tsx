import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Modal,
    Pressable,
} from 'react-native';
import DateTimePicker, {
    DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Clock } from 'lucide-react-native';
import { Spacing, Radius } from '../theme';
import { useAppTheme } from '../theme/useAppTheme';
import { normalizeReminderTime } from '../utils/reminderHelpers';

type Props = {
    value: string;
    onChange: (time: string) => void;
};

function timeToDate(time: string): Date {
    const normalized = normalizeReminderTime(time);
    const [h, m] = normalized.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
}

function dateToTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function ReminderTimePicker({ value, onChange }: Props) {
    const { theme } = useAppTheme();
    const [iosOpen, setIosOpen] = useState(false);
    const display = normalizeReminderTime(value);

    const openPicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: timeToDate(display),
                mode: 'time',
                is24Hour: true,
                onChange: (event, date) => {
                    if (event.type === 'set' && date) {
                        onChange(dateToTime(date));
                    }
                },
            });
            return;
        }
        if (Platform.OS === 'ios') {
            setIosOpen(true);
            return;
        }
        setIosOpen(true);
    };

    return (
        <>
            <TouchableOpacity
                style={[styles.trigger, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={openPicker}
                accessibilityRole="button"
                accessibilityLabel={`Bildirim saati ${display}`}
            >
                <Clock size={20} color={theme.primary} />
                <Text style={[styles.triggerText, { color: theme.text }]}>{display}</Text>
                <Text style={[styles.triggerHint, { color: theme.textSecondary }]}>Değiştir</Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
                <Modal visible={iosOpen} transparent animationType="fade">
                    <Pressable style={styles.modalBackdrop} onPress={() => setIosOpen(false)}>
                        <Pressable
                            style={[styles.modalSheet, { backgroundColor: theme.surface }]}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setIosOpen(false)}>
                                    <Text style={{ color: theme.primary, fontWeight: '600' }}>
                                        Tamam
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={timeToDate(display)}
                                mode="time"
                                display="spinner"
                                locale="tr-TR"
                                onChange={(_, date) => {
                                    if (date) onChange(dateToTime(date));
                                }}
                            />
                        </Pressable>
                    </Pressable>
                </Modal>
            )}

            {Platform.OS === 'web' && iosOpen && (
                <Modal visible transparent animationType="fade">
                    <Pressable style={styles.modalBackdrop} onPress={() => setIosOpen(false)}>
                        <View style={[styles.webPicker, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.webLabel, { color: theme.textSecondary }]}>
                                Saat (24s)
                            </Text>
                            <DateTimePicker
                                value={timeToDate(display)}
                                mode="time"
                                onChange={(_, date) => {
                                    if (date) onChange(dateToTime(date));
                                }}
                            />
                            <TouchableOpacity onPress={() => setIosOpen(false)}>
                                <Text style={{ color: theme.primary, fontWeight: '600' }}>Tamam</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Modal>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
    },
    triggerText: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    triggerHint: {
        fontSize: 14,
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalSheet: {
        borderTopLeftRadius: Radius.lg,
        borderTopRightRadius: Radius.lg,
        paddingBottom: Spacing.xl,
    },
    modalHeader: {
        alignItems: 'flex-end',
        padding: Spacing.md,
    },
    webPicker: {
        margin: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        gap: Spacing.md,
        alignSelf: 'center',
        width: '90%',
        maxWidth: 320,
    },
    webLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
});
