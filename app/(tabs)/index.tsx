import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Plus, Minus, CreditCard, Banknote, History as HistoryIcon } from 'lucide-react-native';
import { Link } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function HomeScreen() {
    const { getTotalBalance, transactions } = useFinanceStore();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const totalBalance = getTotalBalance();
    const recentTransactions = transactions.slice(0, 5);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View style={[styles.balanceCard, { backgroundColor: theme.surface, shadowColor: theme.cardShadow }]}>
                    <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>
                        {format(new Date(), 'd MMMM', { locale: tr })}
                    </Text>
                    <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Toplam Bakiye</Text>
                    <Text style={[
                        styles.balanceAmount,
                        { color: totalBalance >= 0 ? theme.success : theme.danger }
                    ]}>
                        {formatCurrency(totalBalance)}
                    </Text>
                </View>
            </View>

            <View style={styles.quickActions}>
                <Link href="/transaction/add" asChild>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primary }]}>
                        <Text style={styles.actionText}>Etkinlik Ekle</Text>
                    </TouchableOpacity>
                </Link>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Son İşlemler</Text>
                    <Link href="/history" asChild>
                        <TouchableOpacity>
                            <Text style={{ color: theme.primary }}>Tümünü Gör</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                {recentTransactions.length === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
                        <HistoryIcon size={48} color={theme.textSecondary} opacity={0.5} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Henüz işlem bulunmuyor.</Text>
                    </View>
                ) : (
                    recentTransactions.map((t) => (
                        <View key={t.id} style={[styles.transactionItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                            <View style={[styles.iconBox, { backgroundColor: t.method === 'card' ? '#E3F2FD' : '#E8F5E9' }]}>
                                {t.method === 'card' ? <CreditCard size={20} color="#1E88E5" /> : <Banknote size={20} color="#43A047" />}
                            </View>
                            <View style={styles.transactionInfo}>
                                <Text style={[styles.itemCategory, { color: theme.text }]}>{t.category}</Text>
                                <Text style={[styles.itemNote, { color: theme.textSecondary }]} numberOfLines={1}>{t.note || 'Not yok'}</Text>
                            </View>
                            <View style={styles.transactionAmount}>
                                <Text style={[
                                    styles.amountText,
                                    { color: t.type === 'income' ? theme.success : theme.danger }
                                ]}>
                                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                </Text>
                                <Text style={[styles.itemDate, { color: theme.textSecondary }]}>
                                    {format(new Date(t.date), 'd MMM', { locale: tr })}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: Spacing.lg,
        paddingTop: Spacing.xl,
    },
    balanceCard: {
        padding: Spacing.xl,
        borderRadius: Radius.xl,
        alignItems: 'center',
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    dateLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: Spacing.xs,
        textTransform: 'capitalize',
    },
    balanceLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.xs,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    quickActions: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        elevation: 8,
        shadowColor: '#2D6CDF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    actionText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 17,
        letterSpacing: 0.5,
    },
    section: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    emptyState: {
        padding: Spacing.xl,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: 16,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: Radius.md,
        // Note: borderBottom is used if not using cards, but here we use cards
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    transactionInfo: {
        flex: 1,
    },
    itemCategory: {
        fontSize: 16,
        fontWeight: '600',
    },
    itemNote: {
        fontSize: 13,
        marginTop: 2,
    },
    transactionAmount: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemDate: {
        fontSize: 12,
        marginTop: 2,
    }
});
