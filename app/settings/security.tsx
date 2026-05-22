import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Fingerprint } from 'lucide-react-native';
import { useAppLockStore } from '../../src/store/useAppLockStore';
import { getBiometricSupport } from '../../src/utils/biometricAuth';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { Spacing, Radius } from '../../src/theme';
import { feedback } from '../../src/components/feedback';

export default function SecuritySettingsScreen() {
    const router = useRouter();
    const { theme } = useAppTheme();
    const { biometricLockEnabled, setBiometricLockEnabled } = useAppLockStore();
    const [support, setSupport] = useState({
        available: false,
        enrolled: false,
        label: 'Biyometrik',
    });

    useEffect(() => {
        getBiometricSupport().then(setSupport);
    }, []);

    const onToggle = async (value: boolean) => {
        if (value && (!support.available || !support.enrolled)) {
            feedback.warning(
                'Cihazda biyometrik doğrulama kayıtlı değil. Ayarlardan parmak izi veya yüz tanıma ekleyin.'
            );
            return;
        }
        const ok = await setBiometricLockEnabled(value);
        if (!ok && value) {
            feedback.warning('Biyometrik kilit etkinleştirilemedi.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Güvenlik</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Fingerprint size={22} color={theme.primary} />
                <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>
                        {support.label} ile kilitle
                    </Text>
                    <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                        Uygulama 30 sn arka planda kalınca kilitlenir
                    </Text>
                </View>
                <Switch
                    value={biometricLockEnabled}
                    onValueChange={onToggle}
                    trackColor={{ true: theme.primary }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 56,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
    },
    title: { fontSize: 18, fontWeight: 'bold' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: Spacing.lg,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
        gap: Spacing.md,
    },
    rowText: { flex: 1 },
    rowTitle: { fontSize: 16, fontWeight: '600' },
    rowSub: { fontSize: 13, marginTop: 4 },
});
