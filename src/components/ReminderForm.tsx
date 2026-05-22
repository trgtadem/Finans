import React from 'react';
import { View, Text, StyleSheet, TextInput, Switch } from 'react-native';
import { Spacing, Radius } from '../theme';
import { useAppTheme } from '../theme/useAppTheme';
import { ReminderTimePicker } from './ReminderTimePicker';
import { formatRepeatLabel } from '../utils/reminderHelpers';
import { getDate, parseISO } from 'date-fns';

type Props = {
    note: string;
    onNoteChange: (text: string) => void;
    time: string;
    onTimeChange: (time: string) => void;
    repeatMonthly: boolean;
    onRepeatMonthlyChange: (value: boolean) => void;
    date: string;
};

export function ReminderForm({
    note,
    onNoteChange,
    time,
    onTimeChange,
    repeatMonthly,
    onRepeatMonthlyChange,
    date,
}: Props) {
    const { theme } = useAppTheme();
    const dayOfMonth = getDate(parseISO(date));
    const repeatHint =
        formatRepeatLabel({ id: '', note: '', date, time, repeatMonthly: true, dayOfMonth }) ??
        `Her ayın ${dayOfMonth}. günü`;

    return (
        <View style={styles.root}>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Hatırlatılacak Not</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Örn: Kira ödemesi yapılacak"
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        value={note}
                        onChangeText={onNoteChange}
                        maxLength={100}
                    />
                </View>
                <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                    {note.length}/100
                </Text>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Bildirim Saati</Text>
                <ReminderTimePicker value={time} onChange={onTimeChange} />
            </View>

            <View
                style={[
                    styles.repeatRow,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
            >
                <View style={{ flex: 1 }}>
                    <Text style={[styles.repeatTitle, { color: theme.text }]}>
                        Düzenli (her ay)
                    </Text>
                    <Text style={[styles.repeatSubtitle, { color: theme.textSecondary }]}>
                        {repeatMonthly
                            ? repeatHint
                            : 'Tek seferlik — yalnızca seçilen tarihte bildirim'}
                    </Text>
                </View>
                <Switch
                    value={repeatMonthly}
                    onValueChange={onRepeatMonthlyChange}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={theme.surface}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        gap: Spacing.xl,
    },
    inputGroup: {
        gap: Spacing.sm,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
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
        marginRight: 4,
    },
    repeatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
    },
    repeatTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    repeatSubtitle: {
        fontSize: 13,
        marginTop: 4,
    },
});
