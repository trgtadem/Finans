import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Target } from 'lucide-react-native';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { Spacing, Radius } from '../../src/theme';
import { feedback } from '../../src/components/feedback';
import { getMonthlySummary } from '../../src/utils/financeStats';

export default function BudgetSettingsScreen() {
    const router = useRouter();
    const { theme } = useAppTheme();
    const { monthlyExpenseBudget, setMonthlyExpenseBudget, transactions } = useFinanceStore();
    const [amount, setAmount] = useState(
        monthlyExpenseBudget ? String(monthlyExpenseBudget) : ''
    );

    const summary = getMonthlySummary(transactions, monthlyExpenseBudget);

    const handleSave = () => {
        const raw = amount.replace(/[^0-9]/g, '');
        if (!raw) {
            setMonthlyExpenseBudget(null);
            feedback.success('Aylık bütçe kaldırıldı.');
            router.back();
            return;
        }
        const value = parseInt(raw, 10);
        if (value <= 0) {
            feedback.warning('Geçerli bir bütçe girin.');
            return;
        }
        setMonthlyExpenseBudget(value);
        feedback.success('Aylık gider bütçesi kaydedildi.');
        router.back();
    };

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Aylık Bütçe</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.body}>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <Target size={28} color={theme.primary} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                        Bu ay gider hedefi
                    </Text>
                    <Text style={[styles.hint, { color: theme.textSecondary }]}>
                        Bu ay harcanan: {formatCurrency(summary.expense)}
                    </Text>
                    <View style={styles.inputRow}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.primary }}>
                            ₺
                        </Text>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Örn: 15000"
                            placeholderTextColor={theme.textSecondary}
                            keyboardType="numeric"
                            value={amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                            onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                    onPress={handleSave}
                >
                    <Text style={styles.primaryBtnText}>Kaydet</Text>
                </TouchableOpacity>

                {monthlyExpenseBudget != null && (
                    <TouchableOpacity
                        onPress={() => {
                            setAmount('');
                            setMonthlyExpenseBudget(null);
                            feedback.success('Bütçe kaldırıldı.');
                            router.back();
                        }}
                    >
                        <Text style={[styles.clearText, { color: theme.danger }]}>
                            Bütçeyi kaldır
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 56,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
    },
    title: { fontSize: 18, fontWeight: 'bold' },
    body: { padding: Spacing.lg, gap: Spacing.lg },
    card: {
        padding: Spacing.lg,
        borderRadius: Radius.xl,
        gap: Spacing.sm,
        alignItems: 'flex-start',
    },
    cardTitle: { fontSize: 18, fontWeight: '700' },
    hint: { fontSize: 14 },
    inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, width: '100%' },
    input: { flex: 1, fontSize: 28, fontWeight: 'bold', marginLeft: Spacing.sm },
    primaryBtn: {
        height: 52,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    clearText: { textAlign: 'center', fontWeight: '600' },
});
