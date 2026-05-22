import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { Spacing, Radius } from '../../src/theme';
import {
    Plus,
    CreditCard,
    Banknote,
    History as HistoryIcon,
    Bell,
    Target,
    TrendingUp,
    TrendingDown,
} from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { getTodayReminders, getMonthlySummary, todayKey } from '../../src/utils/financeStats';

export default function HomeScreen() {
    const router = useRouter();
    const transactions = useFinanceStore((s) => s.transactions);
    const reminders = useFinanceStore((s) => s.reminders);
    const monthlyExpenseBudget = useFinanceStore((s) => s.monthlyExpenseBudget);
    const totalBalance = useFinanceStore((s) => s.getTotalBalance());
    const { theme } = useAppTheme();
    const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);
    const todayReminders = useMemo(() => getTodayReminders(reminders), [reminders]);
    const monthSummary = useMemo(
        () => getMonthlySummary(transactions, monthlyExpenseBudget),
        [transactions, monthlyExpenseBudget]
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
            amount
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View
                    style={[
                        styles.balanceCard,
                        { backgroundColor: theme.surface, shadowColor: theme.cardShadow },
                    ]}
                >
                    <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>
                        {format(new Date(), 'd MMMM', { locale: tr })}
                    </Text>
                    <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                        Toplam Bakiye
                    </Text>
                    <Text
                        style={[
                            styles.balanceAmount,
                            { color: totalBalance >= 0 ? theme.success : theme.danger },
                        ]}
                    >
                        {formatCurrency(totalBalance)}
                    </Text>
                </View>
            </View>

            <View style={[styles.monthCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.monthTitle, { color: theme.text }]}>
                    {monthSummary.monthLabel} Özeti
                </Text>
                <View style={styles.monthRow}>
                    <View style={styles.monthStat}>
                        <TrendingUp size={16} color={theme.success} />
                        <Text style={[styles.monthLabel, { color: theme.textSecondary }]}>
                            Gelir
                        </Text>
                        <Text style={[styles.monthValue, { color: theme.success }]}>
                            {formatCurrency(monthSummary.income)}
                        </Text>
                    </View>
                    <View style={styles.monthStat}>
                        <TrendingDown size={16} color={theme.danger} />
                        <Text style={[styles.monthLabel, { color: theme.textSecondary }]}>
                            Gider
                        </Text>
                        <Text style={[styles.monthValue, { color: theme.danger }]}>
                            {formatCurrency(monthSummary.expense)}
                        </Text>
                    </View>
                    <View style={styles.monthStat}>
                        <Text style={[styles.monthLabel, { color: theme.textSecondary }]}>
                            Net
                        </Text>
                        <Text
                            style={[
                                styles.monthValue,
                                {
                                    color:
                                        monthSummary.net >= 0 ? theme.success : theme.danger,
                                },
                            ]}
                        >
                            {formatCurrency(monthSummary.net)}
                        </Text>
                    </View>
                </View>
                {monthSummary.budget != null && (
                    <View style={styles.budgetBlock}>
                        <View style={styles.budgetHeader}>
                            <Target size={16} color={theme.primary} />
                            <Text style={[styles.budgetLabel, { color: theme.textSecondary }]}>
                                Bütçe kullanımı %{monthSummary.budgetUsedPercent}
                            </Text>
                            <Link href="/settings/budget" asChild>
                                <TouchableOpacity>
                                    <Text style={{ color: theme.primary, fontSize: 12 }}>
                                        Düzenle
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                        <View
                            style={[
                                styles.progressTrack,
                                { backgroundColor: theme.border },
                            ]}
                        >
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${monthSummary.budgetUsedPercent ?? 0}%`,
                                        backgroundColor:
                                            (monthSummary.budgetUsedPercent ?? 0) >= 100
                                                ? theme.danger
                                                : theme.primary,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={[styles.budgetRemain, { color: theme.textSecondary }]}>
                            Kalan: {formatCurrency(monthSummary.budgetRemaining ?? 0)}
                        </Text>
                    </View>
                )}
                {monthSummary.budget == null && (
                    <Link href="/settings/budget" asChild>
                        <TouchableOpacity>
                            <Text style={{ color: theme.primary, fontSize: 13 }}>
                                Aylık gider bütçesi belirle →
                            </Text>
                        </TouchableOpacity>
                    </Link>
                )}
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Bugünün Hatırlatıcıları
                    </Text>
                    <TouchableOpacity
                        onPress={() =>
                            router.push({
                                pathname: '/reminder/add',
                                params: { date: todayKey() },
                            })
                        }
                    >
                        <Plus size={20} color={theme.primary} />
                    </TouchableOpacity>
                </View>
                {todayReminders.length === 0 ? (
                    <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>
                        Bugün için hatırlatıcı yok.
                    </Text>
                ) : (
                    todayReminders.map((r) => (
                        <View
                            key={r.id}
                            style={[styles.reminderItem, { backgroundColor: theme.surface }]}
                        >
                            <Bell size={18} color={theme.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemCategory, { color: theme.text }]}>
                                    {r.note}
                                </Text>
                                <Text style={[styles.itemNote, { color: theme.textSecondary }]}>
                                    {r.time}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.quickActions}>
                <Link href="/transaction/add" asChild>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    >
                        <Text style={styles.actionText}>İşlem Ekle</Text>
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
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            Henüz işlem bulunmuyor.
                        </Text>
                    </View>
                ) : (
                    recentTransactions.map((t) => (
                        <TouchableOpacity
                            key={t.id}
                            style={[
                                styles.transactionItem,
                                { backgroundColor: theme.surface, borderBottomColor: theme.border },
                            ]}
                            onPress={() =>
                                router.push({
                                    pathname: '/transaction/edit',
                                    params: { id: t.id },
                                })
                            }
                        >
                            <View
                                style={[
                                    styles.iconBox,
                                    {
                                        backgroundColor:
                                            t.method === 'card' ? '#E3F2FD' : '#E8F5E9',
                                    },
                                ]}
                            >
                                {t.method === 'card' ? (
                                    <CreditCard size={20} color="#1E88E5" />
                                ) : (
                                    <Banknote size={20} color="#43A047" />
                                )}
                            </View>
                            <View style={styles.transactionInfo}>
                                <Text style={[styles.itemCategory, { color: theme.text }]}>
                                    {t.category}
                                </Text>
                                <Text
                                    style={[styles.itemNote, { color: theme.textSecondary }]}
                                    numberOfLines={1}
                                >
                                    {t.note || 'Not yok'}
                                </Text>
                            </View>
                            <View style={styles.transactionAmount}>
                                <Text
                                    style={[
                                        styles.amountText,
                                        {
                                            color:
                                                t.type === 'income'
                                                    ? theme.success
                                                    : theme.danger,
                                        },
                                    ]}
                                >
                                    {t.type === 'income' ? '+' : '-'}
                                    {formatCurrency(t.amount)}
                                </Text>
                                <Text style={[styles.itemDate, { color: theme.textSecondary }]}>
                                    {format(new Date(t.date), 'd MMM', { locale: tr })}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: Spacing.lg, paddingTop: Spacing.xl },
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
    balanceAmount: { fontSize: 36, fontWeight: 'bold' },
    monthCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        gap: Spacing.sm,
    },
    monthTitle: { fontSize: 16, fontWeight: '700' },
    monthRow: { flexDirection: 'row', justifyContent: 'space-between' },
    monthStat: { flex: 1, gap: 4 },
    monthLabel: { fontSize: 11 },
    monthValue: { fontSize: 14, fontWeight: '700' },
    budgetBlock: { marginTop: Spacing.sm, gap: 6 },
    budgetHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    budgetLabel: { flex: 1, fontSize: 12 },
    progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    budgetRemain: { fontSize: 12 },
    quickActions: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        alignItems: 'center',
    },
    actionButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radius.full,
        elevation: 4,
    },
    actionText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    section: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: { fontSize: 20, fontWeight: 'bold' },
    emptyHint: { fontSize: 14, marginBottom: Spacing.md },
    reminderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radius.md,
        marginBottom: Spacing.sm,
    },
    emptyState: {
        padding: Spacing.xl,
        borderRadius: Radius.lg,
        alignItems: 'center',
        gap: Spacing.md,
    },
    emptyText: { fontSize: 16 },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: Radius.md,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    transactionInfo: { flex: 1 },
    itemCategory: { fontSize: 16, fontWeight: '600' },
    itemNote: { fontSize: 13, marginTop: 2 },
    transactionAmount: { alignItems: 'flex-end' },
    amountText: { fontSize: 16, fontWeight: 'bold' },
    itemDate: { fontSize: 12, marginTop: 2 },
});
