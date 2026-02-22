import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, useColorScheme, TouchableOpacity } from 'react-native';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { format, isSameDay, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CreditCard, Banknote, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Configure Turkish locale for Calendar
LocaleConfig.locales['tr'] = {
    monthNames: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
    monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
    dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
    today: 'Bugün'
};
LocaleConfig.defaultLocale = 'tr';

export default function CalendarScreen() {
    const router = useRouter();
    const { transactions } = useFinanceStore();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const markedDates = useMemo(() => {
        const marks: any = {};
        transactions.forEach(t => {
            const dateKey = format(parseISO(t.date), 'yyyy-MM-dd');
            if (!marks[dateKey]) {
                marks[dateKey] = { marked: true, dotColor: theme.primary };
            }
        });
        marks[selectedDate] = {
            ...marks[selectedDate],
            selected: true,
            selectedColor: theme.primary
        };
        return marks;
    }, [transactions, selectedDate, theme.primary]);

    const selectedTransactions = useMemo(() => {
        return transactions.filter(t => isSameDay(parseISO(t.date), parseISO(selectedDate)));
    }, [transactions, selectedDate]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    const isFuture = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return parseISO(selectedDate) >= today;
    }, [selectedDate]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Calendar
                onDayPress={(day: any) => setSelectedDate(day.dateString)}
                markedDates={markedDates}
                theme={{
                    backgroundColor: theme.background,
                    calendarBackground: theme.surface,
                    textSectionTitleColor: theme.textSecondary,
                    selectedDayBackgroundColor: theme.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: theme.primary,
                    dayTextColor: theme.text,
                    textDisabledColor: theme.border,
                    dotColor: theme.primary,
                    selectedDotColor: '#ffffff',
                    arrowColor: theme.primary,
                    monthTextColor: theme.text,
                    indicatorColor: theme.primary,
                    textDayFontWeight: '400',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '600',
                }}
            />

            <View style={styles.listHeader}>
                <Text style={[styles.listTitle, { color: theme.text }]}>
                    {format(parseISO(selectedDate), 'd MMMM yyyy', { locale: tr })}
                </Text>
                {isFuture && (
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: theme.primary }]}
                        onPress={() => router.push('/transaction/add')}
                    >
                        <Plus size={20} color="#FFF" />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={selectedTransactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[styles.transactionItem, { backgroundColor: theme.surface }]}>
                        <View style={[styles.iconBox, { backgroundColor: item.method === 'card' ? '#E3F2FD' : '#E8F5E9' }]}>
                            {item.method === 'card' ? <CreditCard size={20} color="#1E88E5" /> : <Banknote size={20} color="#43A047" />}
                        </View>
                        <View style={styles.transactionInfo}>
                            <Text style={[styles.itemCategory, { color: theme.text }]}>{item.category}</Text>
                            <Text style={[styles.itemNote, { color: theme.textSecondary }]}>{item.note || 'Not yok'}</Text>
                        </View>
                        <Text style={[
                            styles.amountText,
                            { color: item.type === 'income' ? theme.success : theme.danger }
                        ]}>
                            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                        </Text>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Bu tarihte işlem bulunmuyor.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        marginTop: Spacing.sm,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xl,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: Radius.md,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    transactionInfo: {
        flex: 1,
    },
    itemCategory: {
        fontSize: 15,
        fontWeight: '600',
    },
    itemNote: {
        fontSize: 12,
        marginTop: 2,
    },
    amountText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    emptyState: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
    }
});
