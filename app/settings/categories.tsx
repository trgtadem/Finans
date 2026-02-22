import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, useColorScheme, Alert } from 'react-native';
import { useFinanceStore, TransactionType } from '../../src/store/useFinanceStore';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Plus, Trash2, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function CategoriesScreen() {
    const router = useRouter();
    const { incomeCategories, expenseCategories, addCategory, deleteCategory } = useFinanceStore();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [activeTab, setActiveTab] = useState<TransactionType>('expense');
    const [newCategory, setNewCategory] = useState('');

    const categories = activeTab === 'income' ? incomeCategories : expenseCategories;

    const handleAdd = () => {
        if (!newCategory.trim()) return;
        if (categories.includes(newCategory.trim())) {
            Alert.alert('Hata', 'Bu kategori zaten mevcut.');
            return;
        }
        addCategory(activeTab, newCategory.trim());
        setNewCategory('');
    };

    const handleDelete = (name: string) => {
        Alert.alert(
            'Kategoriyi Sil',
            `"${name}" kategorisini silmek istediğinize emin misiniz?`,
            [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Sil', style: 'destructive', onPress: () => deleteCategory(activeTab, name) }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Hızlı Notlar (Kategoriler)</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'expense' && { backgroundColor: theme.danger, borderColor: theme.danger }
                    ]}
                    onPress={() => setActiveTab('expense')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'expense' ? '#FFF' : theme.textSecondary }]}>Gider</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'income' && { backgroundColor: theme.success, borderColor: theme.success }
                    ]}
                    onPress={() => setActiveTab('income')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'income' ? '#FFF' : theme.textSecondary }]}>Gelir</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                    placeholder="Yeni kategori adı..."
                    placeholderTextColor={theme.textSecondary}
                    value={newCategory}
                    onChangeText={setNewCategory}
                />
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={handleAdd}>
                    <Plus size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={categories}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                    <View style={[styles.categoryItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                        <Text style={[styles.categoryName, { color: theme.text }]}>{item}</Text>
                        <TouchableOpacity onPress={() => handleDelete(item)}>
                            <Trash2 size={20} color={theme.danger} />
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
    },
    backBtn: {
        marginRight: Spacing.md,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    tab: {
        flex: 1,
        height: 44,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCC',
    },
    tabText: {
        fontWeight: 'bold',
    },
    inputRow: {
        flexDirection: 'row',
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    input: {
        flex: 1,
        height: 50,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        borderWidth: 1,
    },
    addBtn: {
        width: 50,
        height: 50,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: Spacing.md,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
    },
    categoryName: {
        fontSize: 16,
    },
});
