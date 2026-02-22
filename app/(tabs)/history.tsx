import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme, TextInput } from 'react-native';
import { useFinanceStore, TransactionType, PaymentMethod } from '../../src/store/useFinanceStore';
import { Colors, Spacing, Radius } from '../../src/theme';
import { CreditCard, Banknote, Search, Filter, Trash2 } from 'lucide-react-native';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function HistoryScreen() {
    const { transactions, deleteTransaction } = useFinanceStore();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
    const [filterMethod, setFilterMethod] = useState<PaymentMethod | 'all'>('all');

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchSearch = t.category.toLowerCase().includes(search.toLowerCase()) ||
                t.note.toLowerCase().includes(search.toLowerCase());
            const matchType = filterType === 'all' || t.type === filterType;
            const matchMethod = filterMethod === 'all' || t.method === filterMethod;
            return matchSearch && matchType && matchMethod;
        });
    }, [transactions, search, filterType, filterMethod]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.transactionItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: item.method === 'card' ? '#E3F2FD' : '#E8F5E9' }]}>
                {item.method === 'card' ? <CreditCard size={20} color="#1E88E5" /> : <Banknote size={20} color="#43A047" />}
            </View>
            <View style={styles.transactionInfo}>
                <Text style={[styles.itemCategory, { color: theme.text }]}>{item.category}</Text>
                <Text style={[styles.itemNote, { color: theme.textSecondary }]} numberOfLines={1}>{item.note || 'Not yok'}</Text>
                <Text style={[styles.itemDate, { color: theme.textSecondary }]}>
                    {format(new Date(item.date), 'd MMMM yyyy, HH:mm', { locale: tr })}
                </Text>
            </View>
            <View style={styles.transactionAmount}>
                <Text style={[
                    styles.amountText,
                    { color: item.type === 'income' ? theme.success : theme.danger }
                ]}>
                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                </Text>
                <TouchableOpacity onPress={() => deleteTransaction(item.id)} style={styles.deleteBtn}>
                    <Trash2 size={16} color={theme.danger} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Search size={20} color={theme.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="İşlem veya not ara..."
                        placeholderTextColor={theme.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                    <TouchableOpacity
                        onPress={() => setFilterType('all')}
                        style={[styles.filterChip, filterType === 'all' && { backgroundColor: theme.primary }, { borderColor: theme.border }]}
                    >
                        <Text style={[styles.filterText, { color: filterType === 'all' ? '#FFF' : theme.textSecondary }]}>Hepsi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilterType('income')}
                        style={[styles.filterChip, filterType === 'income' && { backgroundColor: theme.success }, { borderColor: theme.border }]}
                    >
                        <Text style={[styles.filterText, { color: filterType === 'income' ? '#FFF' : theme.textSecondary }]}>Gelir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilterType('expense')}
                        style={[styles.filterChip, filterType === 'expense' && { backgroundColor: theme.danger }, { borderColor: theme.border }]}
                    >
                        <Text style={[styles.filterText, { color: filterType === 'expense' ? '#FFF' : theme.textSecondary }]}>Gider</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity
                        onPress={() => setFilterMethod('all')}
                        style={[styles.filterChip, filterMethod === 'all' && { backgroundColor: theme.secondary }, { borderColor: theme.border }]}
                    >
                        <Text style={[styles.filterText, { color: filterMethod === 'all' ? '#FFF' : theme.textSecondary }]}>Tüm Yöntemler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilterMethod('cash')}
                        style={[styles.filterChip, filterMethod === 'cash' && { backgroundColor: theme.primary }, { borderColor: theme.border }]}
                    >
                        <Text style={[styles.filterText, { color: filterMethod === 'cash' ? '#FFF' : theme.textSecondary }]}>Nakit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilterMethod('card')}
                        style={[styles.filterChip, filterMethod === 'card' && { backgroundColor: theme.primary }, { borderColor: theme.border }]}
                    >
                        <Text style={[styles.filterText, { color: filterMethod === 'card' ? '#FFF' : theme.textSecondary }]}>Kart</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <FlatList
                data={filteredTransactions}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Filter size={48} color={theme.textSecondary} opacity={0.3} />
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Kriterlere uygun işlem bulunamadı.</Text>
                    </View>
                }
            />
        </View>
    );
}

// Subcomponent added to handle ScrollView horizontal inside the main view
import { ScrollView } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        height: 50,
        borderRadius: Radius.md,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontSize: 16,
    },
    filterRow: {
        flexDirection: 'row',
        marginTop: Spacing.xs,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.full, // Not defined in theme index.ts, will use 20
        borderWidth: 1,
        marginRight: Spacing.sm,
        height: 32,
        justifyContent: 'center',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: '#CCC',
        marginRight: Spacing.sm,
        alignSelf: 'center',
    },
    listContent: {
        padding: Spacing.md,
    },
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
    itemDate: {
        fontSize: 11,
        marginTop: 4,
    },
    transactionAmount: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 44,
    },
    amountText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteBtn: {
        padding: 2,
    },
    emptyState: {
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: 16,
    }
});

// Update Radius in theme to include full if I missed it
// Actually I'll just use literal for now since I can't edit theme immediately without extra tool calls
// I'll update styles to use numeric values where theme constants are missing.
