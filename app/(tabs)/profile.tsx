import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Spacing, Radius } from '../../src/theme';
import { Settings, Lock, Trash2, Trophy, RotateCcw, X, LogOut, Palette, FileText } from 'lucide-react-native';
import { Link } from 'expo-router';
import { useAppTheme } from '../../src/theme/useAppTheme';

export default function ProfileScreen() {
    const { transactions, resetData } = useFinanceStore();
    const { password: userPassword, logout, setPassword } = useAuthStore();
    const { theme } = useAppTheme();

    const [isResetModalVisible, setIsResetModalVisible] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    const handleReset = () => {
        setIsResetModalVisible(true);
    };

    const handleConfirmReset = () => {
        if (passwordInput === userPassword) {
            setIsResetModalVisible(false);
            setPasswordInput('');
            resetData();
            Alert.alert('Başarılı', 'Tüm veriler temizlendi.');
        } else {
            Alert.alert('Hata', 'Girdiğiniz şifre yanlış.');
        }
    };

    const handleOpenPasswordModal = () => {
        setIsPasswordModalVisible(true);
    };

    const handleClosePasswordModal = () => {
        setIsPasswordModalVisible(false);
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleConfirmPasswordChange = () => {
        if (newPassword.length < 4) {
            Alert.alert('Hata', 'Yeni şifre en az 4 haneli olmalıdır.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
            return;
        }

        setPassword(newPassword);
        handleClosePasswordModal();
        Alert.alert('Başarılı', 'Şifreniz güncellendi.');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Modal
                visible={isResetModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsResetModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Şifre Onayı</Text>
                            <TouchableOpacity onPress={() => { setIsResetModalVisible(false); setPasswordInput(''); }}>
                                <X size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
                            Tüm verileri sıfırlamak için lütfen şifrenizi girin.
                        </Text>

                        <TextInput
                            style={[styles.modalInput, { color: theme.text, borderBottomColor: theme.primary }]}
                            placeholder="Şifreniz"
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry
                            keyboardType="number-pad"
                            autoFocus
                            value={passwordInput}
                            onChangeText={setPasswordInput}
                        />

                        <TouchableOpacity
                            style={[styles.confirmBtn, { backgroundColor: theme.danger }]}
                            onPress={handleConfirmReset}
                        >
                            <Text style={styles.confirmBtnText}>Sıfırlamayı Onayla</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={isPasswordModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={handleClosePasswordModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Şifre Güncelle</Text>
                            <TouchableOpacity onPress={handleClosePasswordModal}>
                                <X size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>Yeni şifrenizi girin ve tekrar ederek doğrulayın.</Text>

                        <TextInput
                            style={[styles.modalInput, styles.modalInputCompact, { color: theme.text, borderBottomColor: theme.primary }]}
                            placeholder="Yeni şifre"
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry
                            keyboardType="number-pad"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            maxLength={8}
                        />

                        <TextInput
                            style={[styles.modalInput, { color: theme.text, borderBottomColor: theme.primary }]}
                            placeholder="Yeni şifre (tekrar)"
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry
                            keyboardType="number-pad"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            maxLength={8}
                        />

                        <TouchableOpacity
                            style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
                            onPress={handleConfirmPasswordChange}
                        >
                            <Text style={styles.confirmBtnText}>Şifreyi Kaydet</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

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
                    <TouchableOpacity style={styles.settingsItem} onPress={handleOpenPasswordModal}>
                        <Lock size={20} color={theme.success} />
                        <Text style={[styles.settingsItemText, { color: theme.text }]}>Şifre Güncelle</Text>
                    </TouchableOpacity>
                    <Link href="/settings/theme" asChild>
                        <TouchableOpacity style={styles.settingsItem}>
                            <Palette size={20} color={theme.primary} />
                            <Text style={[styles.settingsItemText, { color: theme.text }]}>Tema Ayarları</Text>
                        </TouchableOpacity>
                    </Link>
                    <Link href="/reports" asChild>
                        <TouchableOpacity style={styles.settingsItem}>
                            <FileText size={20} color={theme.primary} />
                            <Text style={[styles.settingsItemText, { color: theme.text }]}>Raporlarım</Text>
                        </TouchableOpacity>
                    </Link>
                    <TouchableOpacity style={styles.settingsItem} onPress={logout}>
                        <LogOut size={20} color={theme.danger} />
                        <Text style={[styles.settingsItemText, { color: theme.danger }]}>Çıkış Yap</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0 }]} onPress={handleReset}>
                        <RotateCcw size={20} color={theme.danger} />
                        <Text style={[styles.settingsItemText, { color: theme.danger }]}>Tüm Verileri Sıfırla</Text>
                    </TouchableOpacity>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        width: '100%',
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalDescription: {
        fontSize: 14,
        marginBottom: Spacing.lg,
    },
    modalInput: {
        height: 50,
        borderBottomWidth: 2,
        fontSize: 18,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    modalInputCompact: {
        marginBottom: Spacing.md,
    },
    confirmBtn: {
        height: 50,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
