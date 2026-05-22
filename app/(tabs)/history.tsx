import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ScrollView,
} from 'react-native';
import {
    useFinanceStore,
    TransactionType,
    PaymentMethod,
    type Transaction,
} from '../../src/store/useFinanceStore';
import { useAppSettingsStore } from '../../src/store/useAppSettingsStore';
import { Spacing, Radius } from '../../src/theme';
import { CreditCard, Banknote, Search, Filter, Trash2, Pencil } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAppTheme } from '../../src/theme/useAppTheme';

type Theme = ReturnType<typeof useAppTheme>['theme'];

const TransactionRow = React.memo(function TransactionRow({
    item,
    theme,
    onEdit,
    onDelete,
}: {
    item: Transaction;
    theme: Theme;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

    return (
        <TouchableOpacity
            style={[
                styles.transactionItem,
                { backgroundColor: theme.surface, borderBottomColor: theme.border },
            ]}
            onPress={() => onEdit(item.id)}
        >
            <View
                style={[
                    styles.iconBox,
                    { backgroundColor: item.method === 'card' ? '#E3F2FD' : '#E8F5E9' },
                ]}
            >
                {item.method === 'card' ? (
                    <CreditCard size={20} color="#1E88E5" />
                ) : (
                    <Banknote size={20} color="#43A047" />
                )}
            </View>
            <View style={styles.transactionInfo}>
                <Text style={[styles.itemCategory, { color: theme.text }]}>{item.category}</Text>
                <Text style={[styles.itemNote, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.note || 'Not yok'}
                </Text>
                <Text style={[styles.itemDate, { color: theme.textSecondary }]}>
                    {format(new Date(item.date), 'd MMMM yyyy, HH:mm', { locale: tr })}
                </Text>
            </View>
            <View style={styles.transactionAmount}>
                <Text
                    style={[
                        styles.amountText,
                        { color: item.type === 'income' ? theme.success : theme.danger },
                    ]}
                >
                    {item.type === 'income' ? '+' : '-'}
                    {formatCurrency(item.amount)}
                </Text>
                <TouchableOpacity onPress={() => onEdit(item.id)} style={styles.deleteBtn}>
                    <Pencil size={16} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
                    <Trash2 size={16} color={theme.danger} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
});

export default function HistoryScreen() {
    const router = useRouter();
    const transactions = useFinanceStore((s) => s.transactions);
    const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
    const historyPageSize = useAppSettingsStore((s) => s.historyPageSize);
    const { theme } = useAppTheme();

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
    const [filterMethod, setFilterMethod] = useState<PaymentMethod | 'all'>('all');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');

    const filteredTransactions = useMemo(() => {
        const min = minAmount ? parseFloat(minAmount.replace(',', '.')) : null;
        const max = maxAmount ? parseFloat(maxAmount.replace(',', '.')) : null;

        return transactions.filter((t) => {
            const matchSearch =
                t.category.toLowerCase().includes(search.toLowerCase()) ||
                t.note.toLowerCase().includes(search.toLowerCase());
            const matchType = filterType === 'all' || t.type === filterType;
            const matchMethod = filterMethod === 'all' || t.method === filterMethod;
            const matchMin = min == null || Number.isNaN(min) || t.amount >= min;
            const matchMax = max == null || Number.isNaN(max) || t.amount <= max;
            return matchSearch && matchType && matchMethod && matchMin && matchMax;
        });
    }, [transactions, search, filterType, filterMethod, minAmount, maxAmount]);

    const onEdit = useCallback(
        (id: string) => router.push({ pathname: '/transaction/edit', params: { id } }),
        [router]
    );

    const onDelete = useCallback(
        (id: string) => deleteTransaction(id),
        [deleteTransaction]
    );

    const renderItem = useCallback(
        ({ item }: { item: Transaction }) => (
            <TransactionRow item={item} theme={theme} onEdit={onEdit} onDelete={onDelete} />
        ),
        [theme, onEdit, onDelete]
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View
                    style={[
                        styles.searchContainer,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                >
                    <Search size={20} color={theme.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="İşlem veya not ara..."
                        placeholderTextColor={theme.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <View style={styles.amountRow}>
                    <TextInput
                        style={[
                            styles.amountInput,
                            { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
                        ]}
                        placeholder="Min tutar"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="decimal-pad"
                        value={minAmount}
                        onChangeText={setMinAmount}
                    />
                    <TextInput
                        style={[
                            styles.amountInput,
                            { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
                        ]}
                        placeholder="Max tutar"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="decimal-pad"
                        value={maxAmount}
                        onChangeText={setMaxAmount}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                    <TouchableOpacity
                        onPress={() => setFilterType('all')}
                        style={[
                            styles.filterChip,
                            filterType === 'all' && { backgroundColor: theme.primary },
                            { borderColor: theme.border },
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: filterType === 'all' ? '#FFF' : theme.textSecondary },
                            ]}
                        >
                            Hepsi
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilterType('income')}
                        style={[
                            styles.filterChip,
                            filterType === 'income' && { backgroundColor: theme.success },
                            { borderColor: theme.border },
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: filterType === 'income' ? '#FFF' : theme.textSecondary },
                            ]}
                        >
                            Gelir
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilterType('expense')}
                        style={[
                            styles.filterChip,
                            filterType === 'expense' && { backgroundColor: theme.danger },
                            { borderColor: theme.border },
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: filterType === 'expense' ? '#FFF' : theme.textSecondary },
                            ]}
                        >
                            Gider
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        onPress={() => setFilterMethod('all')}
                        style={[
                            styles.filterChip,
                            filterMethod === 'all' && { backgroundColor: theme.secondary },
                            { borderColor: theme.border },
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: filterMethod === 'all' ? '#FFF' : theme.textSecondary },
                            ]}
                        >
                            Tüm Yöntemler
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilterMethod('cash')}
                        style={[
                            styles.filterChip,
                            filterMethod === 'cash' && { backgroundColor: theme.primary },
                            { borderColor: theme.border },
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: filterMethod === 'cash' ? '#FFF' : theme.textSecondary },
                            ]}
                        >
                            Nakit
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilterMethod('card')}
                        style={[
                            styles.filterChip,
                            filterMethod === 'card' && { backgroundColor: theme.primary },
                            { borderColor: theme.border },
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: filterMethod === 'card' ? '#FFF' : theme.textSecondary },
                            ]}
                        >
                            Kart
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <FlatList
                data={filteredTransactions}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                initialNumToRender={historyPageSize}
                maxToRenderPerBatch={20}
                windowSize={7}
                removeClippedSubviews
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Filter size={48} color={theme.textSecondary} opacity={0.3} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            Kriterlere uygun işlem bulunamadı.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: Spacing.md, gap: Spacing.sm },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        height: 50,
        borderRadius: Radius.md,
        borderWidth: 1,
    },
    searchInput: { flex: 1, marginLeft: Spacing.sm, fontSize: 16 },
    amountRow: { flexDirection: 'row', gap: Spacing.sm },
    amountInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.sm,
        fontSize: 14,
    },
    filterRow: { flexDirection: 'row', marginTop: Spacing.xs },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: Spacing.sm,
        height: 32,
        justifyContent: 'center',
    },
    filterText: { fontSize: 12, fontWeight: '600' },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: '#CCC',
        marginRight: Spacing.sm,
        alignSelf: 'center',
    },
    listContent: { padding: Spacing.md },
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
    itemDate: { fontSize: 11, marginTop: 4 },
    transactionAmount: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 44,
    },
    amountText: { fontSize: 16, fontWeight: 'bold' },
    deleteBtn: { padding: 2 },
    emptyState: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
    },
    emptyText: { fontSize: 16 },
});
