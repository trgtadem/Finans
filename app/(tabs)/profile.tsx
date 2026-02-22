import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Settings, Lock, Trash2, Trophy } from 'lucide-react-native';
import { Link } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function ProfileScreen() {
    const { transactions } = useFinanceStore();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View style={styles.profileRow}>
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                        <Text style={styles.avatarText}>A</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: theme.text }]}>Standart Kullanıcı</Text>
                        <Text style={[styles.profileDetails, { color: theme.textSecondary }]}>Finans Yönetimi</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                        <Trophy size={20} color={theme.primary} style={{ marginBottom: 4 }} />
                        <Text style={[styles.statValue, { color: theme.success }]}>{formatCurrency(totalIncome)}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Toplam Gelir</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                        <Trash2 size={20} color={theme.danger} style={{ marginBottom: 4 }} />
                        <Text style={[styles.statValue, { color: theme.danger }]}>{formatCurrency(totalExpense)}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Toplam Gider</Text>
                    </View>
                </View>
            </View>

            <View style={styles.settingsSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Ayarlar</Text>
                <View style={[styles.settingsList, { backgroundColor: theme.surface }]}>
                    <Link href="/settings/categories" asChild>
                        <TouchableOpacity style={styles.settingsItem}>
                            <Settings size={20} color={theme.primary} />
                            <Text style={[styles.settingsItemText, { color: theme.text }]}>Hızlı Notları Düzenle</Text>
                        </TouchableOpacity>
                    </Link>
                    <Link href="/settings/security" asChild>
                        <TouchableOpacity style={styles.settingsItem}>
                            <Lock size={20} color={theme.success} />
                            <Text style={[styles.settingsItemText, { color: theme.text }]}>Şifre Güncelle</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: Spacing.lg,
        paddingTop: 60,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    profileDetails: {
        fontSize: 14,
    },
    settingsBtn: {
        padding: 10,
        borderRadius: Radius.md,
        elevation: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    statCard: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        alignItems: 'center',
        elevation: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radius.lg,
        marginBottom: Spacing.sm,
        elevation: 1,
    },
    checkbox: {
        marginRight: Spacing.md,
    },
    taskInfo: {
        flex: 1,
    },
    taskText: {
        fontSize: 16,
        fontWeight: '500',
    },
    taskDate: {
        fontSize: 12,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontSize: 16,
    },
    settingsSection: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    settingsList: {
        borderRadius: Radius.lg,
        overflow: 'hidden',
        elevation: 2,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingLeft: Spacing.md + 10,
        paddingRight: Spacing.md,
        gap: Spacing.md,
        borderBottomWidth: 1,
    },
    settingsItemText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
