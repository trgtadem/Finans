import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, useColorScheme, KeyboardAvoidingView, Platform } from 'react-native';
import { useFinanceStore, TransactionType, PaymentMethod } from '../../src/store/useFinanceStore';
import { Colors, Spacing, Radius } from '../../src/theme';
import { CreditCard, Banknote, Check } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function AddTransactionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ date?: string }>();
    const { addTransaction, incomeCategories, expenseCategories } = useFinanceStore();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [type, setType] = useState<TransactionType | null>(null);
    const [method, setMethod] = useState<PaymentMethod>('cash');
    const [amount, setAmount] = useState(''); // Stores raw number string
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');

    const transactionDate = params.date || new Date().toISOString();

    const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

    // Reset category if it's not in the current list when type changes
    React.useEffect(() => {
        if (type && !currentCategories.includes(category)) {
            setCategory(currentCategories[0] || '');
        }
    }, [type, currentCategories]);

    const handleAmountChange = (text: string) => {
        // Remove existing dots and non-numeric chars to get raw number
        const raw = text.replace(/[^0-9]/g, '');

        // Limit to 10 digits (9.999.999.999)
        if (raw.length <= 10) {
            setAmount(raw);
        }
    };

    const handleSave = () => {
        if (!type) {
            alert('Lütfen işlem türünü (Gelir/Gider) seçin.');
            return;
        }

        if (!amount || isNaN(parseFloat(amount))) {
            alert('Lütfen geçerli bir tutar girin.');
            return;
        }

        const numericAmount = parseFloat(amount);
        if (numericAmount > 9999999999) {
            alert('Tutar çok yüksek. Lütfen daha küçük bir değer girin.');
            return;
        }

        addTransaction({
            type,
            method,
            amount: numericAmount,
            category,
            note,
            date: transactionDate,
        });

        router.back();
    };

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
                    {/* Type Selector */}
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                { backgroundColor: type === 'expense' ? theme.danger : theme.surface, borderColor: theme.border }
                            ]}
                            onPress={() => setType('expense')}
                        >
                            <Text style={[styles.typeText, { color: type === 'expense' ? '#FFF' : theme.text }]}>Gider</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                { backgroundColor: type === 'income' ? theme.success : theme.surface, borderColor: theme.border }
                            ]}
                            onPress={() => setType('income')}
                        >
                            <Text style={[styles.typeText, { color: type === 'income' ? '#FFF' : theme.text }]}>Gelir</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Amount Input */}
                    <View style={[styles.inputGroup, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Tutar</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.primary, marginRight: 4 }}>₺</Text>
                            <TextInput
                                style={[styles.amountInput, { color: theme.primary, flex: 1 }]}
                                placeholder="0"
                                placeholderTextColor={theme.textSecondary}
                                keyboardType="numeric"
                                value={amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                onChangeText={handleAmountChange}
                                maxLength={13} // Account for dots in formatted view (10 digits + 3 dots)
                                autoFocus
                            />
                        </View>
                    </View>

                    {/* Method Selector */}
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Ödeme Yöntemi</Text>
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[
                                styles.methodButton,
                                { backgroundColor: theme.surface, borderColor: method === 'cash' ? theme.primary : theme.border }
                            ]}
                            onPress={() => setMethod('cash')}
                        >
                            <Banknote size={24} color={method === 'cash' ? theme.primary : theme.textSecondary} />
                            <Text style={[styles.methodText, { color: method === 'cash' ? theme.primary : theme.textSecondary }]}>Nakit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.methodButton,
                                { backgroundColor: theme.surface, borderColor: method === 'card' ? theme.primary : theme.border }
                            ]}
                            onPress={() => setMethod('card')}
                        >
                            <CreditCard size={24} color={method === 'card' ? theme.primary : theme.textSecondary} />
                            <Text style={[styles.methodText, { color: method === 'card' ? theme.primary : theme.textSecondary }]}>Kredi Kartı</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Category Selector */}
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Kategori</Text>
                    <View style={styles.categoryWrap}>
                        {!type ? (
                            <Text style={{ color: theme.textSecondary, fontStyle: 'italic' }}>Önce işlem türünü seçin...</Text>
                        ) : (
                            currentCategories.map((cat: string) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.categoryChip,
                                        {
                                            backgroundColor: category === cat ? theme.primary : theme.surface,
                                            borderColor: theme.border
                                        }
                                    ]}
                                    onPress={() => setCategory(cat)}
                                >
                                    <Text style={[styles.categoryText, { color: category === cat ? '#FFF' : theme.text }]}>{cat}</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    {/* Note Input */}
                    <View style={[styles.inputGroup, { backgroundColor: theme.surface, marginTop: Spacing.md }]}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Not</Text>
                        <TextInput
                            style={[styles.noteInput, { color: theme.text }]}
                            placeholder="İşlem ile ilgili not yazın..."
                            placeholderTextColor={theme.textSecondary}
                            value={note}
                            onChangeText={setNote}
                            multiline
                            maxLength={200}
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSave}>
                        <Check size={24} color="#FFF" />
                        <Text style={styles.saveButtonText}>Kaydet</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    typeButton: {
        flex: 1,
        height: 50,
        borderRadius: Radius.md,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    inputGroup: {
        padding: Spacing.md,
        borderRadius: Radius.lg,
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: Spacing.xs,
    },
    amountInput: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: Spacing.sm,
    },
    methodButton: {
        flex: 1,
        height: 80,
        borderRadius: Radius.lg,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    methodText: {
        fontWeight: '600',
    },
    categoryWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    categoryChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.md,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '500',
    },
    noteInput: {
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        height: 60,
        borderRadius: Radius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.md,
        marginBottom: Spacing.xl,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
