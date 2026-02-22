import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, useColorScheme, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Bell, Check, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function AddReminderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ date: string }>();
    const { addReminder } = useFinanceStore();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [note, setNote] = useState('');

    const reminderDate = params.date;

    const handleSave = () => {
        if (!note.trim()) {
            Alert.alert('Hata', 'Lütfen bir not girin.');
            return;
        }

        addReminder({
            note: note.trim(),
            date: reminderDate,
        });

        router.back();
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
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Check size={24} color={theme.primary} />
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

                <TouchableOpacity
                    style={[styles.mainButton, { backgroundColor: theme.primary }]}
                    onPress={handleSave}
                >
                    <Text style={styles.mainButtonText}>Kaydet</Text>
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
