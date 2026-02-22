import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, useColorScheme, Alert } from 'react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Lock, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function SecurityScreen() {
    const router = useRouter();
    const { logout, setPassword } = useAuthStore();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [newPassword, setNewPassword] = useState('');

    const handleChangePassword = () => {
        if (newPassword.length < 4) {
            Alert.alert('Hata', 'Şifre en az 4 haneli olmalıdır.');
            return;
        }
        setPassword(newPassword);
        setNewPassword('');
        Alert.alert('Başarılı', 'Şifre güncellendi.');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Şifre ve Güvenlik</Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ŞİFRE GÜNCELLE</Text>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
                        placeholder="Yeni Şifre"
                        placeholderTextColor={theme.textSecondary}
                        secureTextEntry
                        keyboardType="number-pad"
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.secondary }]} onPress={handleChangePassword}>
                        <Lock size={20} color="#FFF" />
                        <Text style={styles.actionButtonText}>Şifreyi Güncelle</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <TouchableOpacity style={[styles.logoutBtn, { borderColor: theme.danger }]} onPress={logout}>
                    <Text style={{ color: theme.danger, fontWeight: 'bold' }}>Çıkış Yap</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
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
    section: {
        padding: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: Spacing.sm,
        letterSpacing: 1,
    },
    card: {
        padding: Spacing.md,
        borderRadius: Radius.lg,
        gap: Spacing.sm,
    },
    input: {
        height: 50,
        fontSize: 16,
        borderBottomWidth: 1,
    },
    actionButton: {
        height: 50,
        borderRadius: Radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    actionButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    logoutBtn: {
        height: 50,
        borderRadius: Radius.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.xl,
    }
});
