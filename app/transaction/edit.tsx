import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useFinanceStore, TransactionType, PaymentMethod } from '../../src/store/useFinanceStore';
import { Spacing, Radius } from '../../src/theme';
import { CreditCard, Banknote, Check } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { feedback } from '../../src/components/feedback';

export default function EditTransactionScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { transactions, updateTransaction, incomeCategories, expenseCategories } =
        useFinanceStore();
    const { theme } = useAppTheme();

    const existing = transactions.find((t) => t.id === id);

    const [type, setType] = useState<TransactionType | null>(existing?.type ?? null);
    const [method, setMethod] = useState<PaymentMethod>(existing?.method ?? 'cash');
    const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
    const [category, setCategory] = useState(existing?.category ?? '');
    const [note, setNote] = useState(existing?.note ?? '');

    useEffect(() => {
        if (!existing) {
            feedback.error('İşlem bulunamadı.');
            router.back();
        }
    }, [existing, router]);

    const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

    useEffect(() => {
        if (type && category && !currentCategories.includes(category)) {
            setCategory(currentCategories[0] || '');
        }
    }, [type, currentCategories, category]);

    const handleAmountChange = (text: string) => {
        const raw = text.replace(/[^0-9]/g, '');
        if (raw.length <= 10) setAmount(raw);
    };

    const handleSave = () => {
        if (!id || !type) {
            feedback.warning('Lütfen işlem türünü seçin.');
            return;
        }
        if (!amount || isNaN(parseFloat(amount))) {
            feedback.warning('Lütfen geçerli bir tutar girin.');
            return;
        }
        const numericAmount = parseFloat(amount);
        if (numericAmount > 9999999999) {
            feedback.warning('Tutar çok yüksek.');
            return;
        }

        updateTransaction(id, {
            type,
            method,
            amount: numericAmount,
            category,
            note,
        });
        feedback.success('İşlem güncellendi.');
        router.back();
    };

    if (!existing) return null;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView
                style={[styles.container, { backgroundColor: theme.background }]}
                contentContainerStyle={{ paddingBottom: Spacing.xl }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                {
                                    backgroundColor:
                                        type === 'expense' ? theme.danger : theme.surface,
                                    borderColor: theme.border,
                                },
                            ]}
                            onPress={() => setType('expense')}
                        >
                            <Text
                                style={[
                                    styles.typeText,
                                    { color: type === 'expense' ? '#FFF' : theme.text },
                                ]}
                            >
                                Gider
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                {
                                    backgroundColor:
                                        type === 'income' ? theme.success : theme.surface,
                                    borderColor: theme.border,
                                },
                            ]}
                            onPress={() => setType('income')}
                        >
                            <Text
                                style={[
                                    styles.typeText,
                                    { color: type === 'income' ? '#FFF' : theme.text },
                                ]}
                            >
                                Gelir
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.inputGroup, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Tutar</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text
                                style={{
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                    color: theme.primary,
                                    marginRight: 4,
                                }}
                            >
                                ₺
                            </Text>
                            <TextInput
                                style={[styles.amountInput, { color: theme.primary, flex: 1 }]}
                                keyboardType="numeric"
                                value={amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                onChangeText={handleAmountChange}
                                maxLength={13}
                            />
                        </View>
                    </View>

                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                        Ödeme Yöntemi
                    </Text>
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[
                                styles.methodButton,
                                {
                                    backgroundColor: theme.surface,
                                    borderColor:
                                        method === 'cash' ? theme.primary : theme.border,
                                },
                            ]}
                            onPress={() => setMethod('cash')}
                        >
                            <Banknote
                                size={24}
                                color={method === 'cash' ? theme.primary : theme.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.methodText,
                                    {
                                        color:
                                            method === 'cash'
                                                ? theme.primary
                                                : theme.textSecondary,
                                    },
                                ]}
                            >
                                Nakit
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.methodButton,
                                {
                                    backgroundColor: theme.surface,
                                    borderColor:
                                        method === 'card' ? theme.primary : theme.border,
                                },
                            ]}
                            onPress={() => setMethod('card')}
                        >
                            <CreditCard
                                size={24}
                                color={method === 'card' ? theme.primary : theme.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.methodText,
                                    {
                                        color:
                                            method === 'card'
                                                ? theme.primary
                                                : theme.textSecondary,
                                    },
                                ]}
                            >
                                Kart
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                        Kategori
                    </Text>
                    <View style={styles.categoryWrap}>
                        {currentCategories.map((cat: string) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryChip,
                                    {
                                        backgroundColor:
                                            category === cat ? theme.primary : theme.surface,
                                        borderColor: theme.border,
                                    },
                                ]}
                                onPress={() => setCategory(cat)}
                            >
                                <Text
                                    style={[
                                        styles.categoryText,
                                        { color: category === cat ? '#FFF' : theme.text },
                                    ]}
                                >
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View
                        style={[
                            styles.inputGroup,
                            { backgroundColor: theme.surface, marginTop: Spacing.md },
                        ]}
                    >
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Not</Text>
                        <TextInput
                            style={[styles.noteInput, { color: theme.text }]}
                            value={note}
                            onChangeText={setNote}
                            multiline
                            maxLength={200}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: theme.primary }]}
                        onPress={handleSave}
                    >
                        <Check size={24} color="#FFF" />
                        <Text style={styles.saveButtonText}>Güncelle</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.lg },
    row: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
    typeButton: {
        flex: 1,
        height: 50,
        borderRadius: Radius.md,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeText: { fontWeight: 'bold', fontSize: 16 },
    inputGroup: { padding: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.lg },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: Spacing.xs,
    },
    amountInput: { fontSize: 32, fontWeight: 'bold' },
    sectionLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: Spacing.sm },
    methodButton: {
        flex: 1,
        height: 80,
        borderRadius: Radius.lg,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    methodText: { fontWeight: '600' },
    categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    categoryChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.md,
        borderWidth: 1,
    },
    categoryText: { fontSize: 14, fontWeight: '500' },
    noteInput: { fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
    saveButton: {
        height: 60,
        borderRadius: Radius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
