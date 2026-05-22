import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Target, Tags } from 'lucide-react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAppSettingsStore } from '../store/useAppSettingsStore';
import { useAppTheme } from '../theme/useAppTheme';
import { Spacing, Radius } from '../theme';
import { feedback } from './feedback';

export function OnboardingModal() {
    const { theme } = useAppTheme();
    const hasCompletedOnboarding = useAppSettingsStore((s) => s.hasCompletedOnboarding);
    const setHasCompletedOnboarding = useAppSettingsStore((s) => s.setHasCompletedOnboarding);
    const setMonthlyExpenseBudget = useFinanceStore((s) => s.setMonthlyExpenseBudget);
    const addCategory = useFinanceStore((s) => s.addCategory);

    const [budget, setBudget] = useState('');
    const [visible, setVisible] = useState(!hasCompletedOnboarding);

    if (!visible || hasCompletedOnboarding) return null;

    const finish = () => {
        setHasCompletedOnboarding(true);
        setVisible(false);
    };

    const handleStart = () => {
        const amount = parseFloat(budget.replace(',', '.'));
        if (!Number.isNaN(amount) && amount > 0) {
            setMonthlyExpenseBudget(amount);
        }
        addCategory('expense', 'Market');
        addCategory('income', 'Maaş');
        feedback.success('Hoş geldiniz! Finans takibinize başlayabilirsiniz.');
        finish();
    };

    const handleSkip = () => {
        finish();
    };

    return (
        <Modal visible transparent animationType="fade">
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.title, { color: theme.text }]}>Finans’a hoş geldiniz</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Kısa kurulum ile bütçe ve örnek kategoriler ekleyebilirsiniz.
                    </Text>

                    <View style={styles.row}>
                        <Target size={20} color={theme.primary} />
                        <Text style={[styles.rowLabel, { color: theme.text }]}>
                            Aylık gider bütçesi (isteğe bağlı)
                        </Text>
                    </View>
                    <TextInput
                        style={[
                            styles.input,
                            { color: theme.text, borderColor: theme.border },
                        ]}
                        placeholder="Örn. 15000"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="decimal-pad"
                        value={budget}
                        onChangeText={setBudget}
                    />

                    <View style={styles.row}>
                        <Tags size={20} color={theme.secondary} />
                        <Text style={[styles.hint, { color: theme.textSecondary }]}>
                            Market ve Maaş kategorileri eklenecek
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.primary, { backgroundColor: theme.primary }]}
                        onPress={handleStart}
                    >
                        <Text style={styles.primaryText}>Başla</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSkip} style={styles.skip}>
                        <Text style={{ color: theme.textSecondary }}>Şimdilik atla</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    card: {
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    title: { fontSize: 22, fontWeight: 'bold' },
    subtitle: { fontSize: 14, lineHeight: 20 },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    rowLabel: { fontSize: 15, fontWeight: '500' },
    hint: { fontSize: 13, flex: 1 },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        fontSize: 16,
    },
    primary: {
        height: 48,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.sm,
    },
    primaryText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    skip: { alignItems: 'center', paddingVertical: Spacing.sm },
});
