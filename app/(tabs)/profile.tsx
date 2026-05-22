import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Spacing, Radius } from '../../src/theme';
import { Settings, Lock, Trash2, Trophy, RotateCcw, X, LogOut, Palette, FileText, Target, Shield, Cloud, Gauge } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { isFirebaseConfigured } from '../../src/config/firebase';
import { clearUserFinance } from '../../src/services/firebase/financeRepository';
import {
    sanitizePinInput,
    pinValidationMessage,
    PIN_LENGTH,
} from '../../src/utils/pinAuth';
import { feedback } from '../../src/components/feedback';
import { verifyLocalPin } from '../../src/utils/securePin';

type SettingsRowProps = {
    icon: React.ReactNode;
    label: string;
    labelColor?: string;
    onPress: () => void;
    isLast?: boolean;
    theme: ReturnType<typeof useAppTheme>['theme'];
};

function SettingsRow({ icon, label, labelColor, onPress, isLast, theme }: SettingsRowProps) {
    return (
        <TouchableOpacity
            style={[
                styles.settingsItem,
                { borderBottomColor: theme.border },
                isLast && styles.settingsItemLast,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.settingsIcon}>{icon}</View>
            <Text
                style={[
                    styles.settingsItemText,
                    { color: labelColor ?? theme.text },
                ]}
                numberOfLines={2}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

export default function ProfileScreen() {
    const router = useRouter();
    const { transactions, resetData } = useFinanceStore();
    const {
        logout,
        setPassword,
        user,
        authMode,
        updateFirebasePassword,
        authError,
        clearAuthError,
    } = useAuthStore();
    const { theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const useFirebase = isFirebaseConfigured() && authMode === 'firebase';

    const [isResetModalVisible, setIsResetModalVisible] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    const displayName = user?.email?.split('@')[0] ?? 'Kullanıcı';
    const avatarLetter = (user?.email?.[0] ?? displayName[0] ?? 'K').toUpperCase();

    const handleLogout = () => {
        feedback.confirm({
            title: 'Çıkış Yap',
            message: 'Hesabınızdan çıkış yapılacak. Emin misiniz?',
            confirmText: 'Çıkış Yap',
            destructive: true,
            onConfirm: () => logout(),
        });
    };

    const handleReset = () => {
        setIsResetModalVisible(true);
    };

    const performReset = async () => {
        setIsResetModalVisible(false);
        setPasswordInput('');
        resetData();
        try {
            if (user?.uid) {
                await clearUserFinance(user.uid);
            }
            feedback.success('Tüm veriler temizlendi.');
        } catch {
            feedback.error('Veriler sıfırlanırken bir hata oluştu.');
        }
    };

    const handleConfirmReset = () => {
        if (useFirebase) {
            feedback.confirm({
                title: 'Verileri Sıfırla',
                message: 'Tüm işlem ve hatırlatıcı verileri silinecek. Emin misiniz?',
                confirmText: 'Sıfırla',
                destructive: true,
                onConfirm: () => performReset(),
            });
            return;
        }

        verifyLocalPin(passwordInput).then((valid) => {
            if (valid) {
                performReset();
            } else {
                feedback.error('Girdiğiniz şifre yanlış.');
            }
        });
    };

    const handleOpenPasswordModal = () => {
        clearAuthError();
        setIsPasswordModalVisible(true);
    };

    const handleClosePasswordModal = () => {
        setIsPasswordModalVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        clearAuthError();
    };

    const handleConfirmPasswordChange = async () => {
        const newPinError = pinValidationMessage(newPassword);
        if (newPinError) {
            feedback.error(newPinError);
            return;
        }

        if (newPassword !== confirmPassword) {
            feedback.error('Yeni şifreler eşleşmiyor.');
            return;
        }

        if (useFirebase) {
            const currentPinError = pinValidationMessage(currentPassword);
            if (currentPinError) {
                feedback.error(currentPinError);
                return;
            }
            try {
                await updateFirebasePassword(currentPassword, newPassword);
                handleClosePasswordModal();
                feedback.success('Şifreniz güncellendi.');
            } catch {
                const message = useAuthStore.getState().authError;
                if (message) feedback.error(message);
            }
            return;
        }

        await setPassword(newPassword);
        handleClosePasswordModal();
        feedback.success('Şifreniz güncellendi.');
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
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {useFirebase ? 'Verileri Sıfırla' : 'Şifre Onayı'}
                            </Text>
                            <TouchableOpacity onPress={() => { setIsResetModalVisible(false); setPasswordInput(''); }}>
                                <X size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
                            {useFirebase
                                ? 'Tüm işlem ve hatırlatıcı verileri silinecek.'
                                : 'Tüm verileri sıfırlamak için lütfen şifrenizi girin.'}
                        </Text>

                        {!useFirebase && (
                            <TextInput
                                style={[styles.modalInput, { color: theme.text, borderBottomColor: theme.primary }]}
                                placeholder="Şifreniz"
                                placeholderTextColor={theme.textSecondary}
                                secureTextEntry
                                keyboardType="number-pad"
                                autoFocus
                                maxLength={PIN_LENGTH}
                                value={passwordInput}
                                onChangeText={(t) => setPasswordInput(sanitizePinInput(t))}
                            />
                        )}

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

                        <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
                            6 haneli yeni şifrenizi girin ve tekrar ederek doğrulayın.
                        </Text>

                        {useFirebase && (
                            <TextInput
                                style={[styles.modalInput, styles.modalInputCompact, { color: theme.text, borderBottomColor: theme.primary }]}
                                placeholder="Mevcut 6 haneli şifre"
                                placeholderTextColor={theme.textSecondary}
                                secureTextEntry
                                keyboardType="number-pad"
                                maxLength={PIN_LENGTH}
                                value={currentPassword}
                                onChangeText={(t) => setCurrentPassword(sanitizePinInput(t))}
                            />
                        )}

                        <TextInput
                            style={[styles.modalInput, styles.modalInputCompact, { color: theme.text, borderBottomColor: theme.primary }]}
                            placeholder="Yeni 6 haneli şifre"
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry
                            keyboardType="number-pad"
                            maxLength={PIN_LENGTH}
                            value={newPassword}
                            onChangeText={(t) => setNewPassword(sanitizePinInput(t))}
                        />

                        <TextInput
                            style={[styles.modalInput, { color: theme.text, borderBottomColor: theme.primary }]}
                            placeholder="Yeni şifre (tekrar)"
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry
                            keyboardType="number-pad"
                            maxLength={PIN_LENGTH}
                            value={confirmPassword}
                            onChangeText={(t) => setConfirmPassword(sanitizePinInput(t))}
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

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: Spacing.xl + insets.bottom + 24 },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <View style={styles.profileRow}>
                        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                            <Text style={styles.avatarText}>{avatarLetter}</Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileName, { color: theme.text }]}>{displayName}</Text>
                            <Text style={[styles.profileDetails, { color: theme.textSecondary }]}>
                                {user?.email ?? 'Finans Yönetimi'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                            <Trophy size={20} color={theme.primary} style={{ marginBottom: 4 }} />
                            <Text style={[styles.statValue, { color: theme.success }]}>
                                {formatCurrency(totalIncome)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                                Toplam Gelir
                            </Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                            <Trash2 size={20} color={theme.danger} style={{ marginBottom: 4 }} />
                            <Text style={[styles.statValue, { color: theme.danger }]}>
                                {formatCurrency(totalExpense)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                                Toplam Gider
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.settingsSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Ayarlar</Text>
                    <View
                        style={[
                            styles.settingsList,
                            {
                                backgroundColor: theme.surface,
                                borderColor: theme.border,
                            },
                        ]}
                    >
                        <SettingsRow
                            theme={theme}
                            icon={<Settings size={20} color={theme.primary} />}
                            label="Hızlı Notları Düzenle"
                            onPress={() => router.push('/settings/categories')}
                        />
                        <SettingsRow
                            theme={theme}
                            icon={<Lock size={20} color={theme.success} />}
                            label="Şifre Güncelle"
                            onPress={handleOpenPasswordModal}
                        />
                        {useFirebase && (
                            <SettingsRow
                                theme={theme}
                                icon={<Cloud size={20} color={theme.primary} />}
                                label="Senkronizasyon"
                                onPress={() => router.push('/settings/sync')}
                            />
                        )}
                        <SettingsRow
                            theme={theme}
                            icon={<Gauge size={20} color={theme.secondary} />}
                            label="Performans"
                            onPress={() => router.push('/settings/performance')}
                        />
                        <SettingsRow
                            theme={theme}
                            icon={<Target size={20} color={theme.primary} />}
                            label="Aylık Bütçe"
                            onPress={() => router.push('/settings/budget')}
                        />
                        <SettingsRow
                            theme={theme}
                            icon={<Shield size={20} color={theme.success} />}
                            label="Biyometrik Kilit"
                            onPress={() => router.push('/settings/security')}
                        />
                        <SettingsRow
                            theme={theme}
                            icon={<Palette size={20} color={theme.primary} />}
                            label="Tema Ayarları"
                            onPress={() => router.push('/settings/theme')}
                        />
                        <SettingsRow
                            theme={theme}
                            icon={<FileText size={20} color={theme.primary} />}
                            label="Raporlarım"
                            onPress={() => router.push('/reports')}
                        />
                        <SettingsRow
                            theme={theme}
                            icon={<LogOut size={20} color={theme.danger} />}
                            label="Çıkış Yap"
                            labelColor={theme.danger}
                            onPress={handleLogout}
                        />
                        <SettingsRow
                            theme={theme}
                            icon={<RotateCcw size={20} color={theme.danger} />}
                            label="Tüm Verileri Sıfırla"
                            labelColor={theme.danger}
                            onPress={handleReset}
                            isLast
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        padding: Spacing.lg,
        paddingTop: Spacing.md,
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
        marginBottom: Spacing.md,
    },
    settingsSection: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    settingsList: {
        width: '100%',
        borderRadius: Radius.lg,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        minHeight: 52,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    settingsItemLast: {
        borderBottomWidth: 0,
    },
    settingsIcon: {
        width: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    settingsItemText: {
        flex: 1,
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
