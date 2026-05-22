import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Fingerprint } from 'lucide-react-native';
import { useAppLockStore } from '../store/useAppLockStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../theme/useAppTheme';
import { Spacing, Radius } from '../theme';
import { feedback } from './feedback';

export function AppLockGate({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const { biometricLockEnabled, isLocked, unlock, initAppStateListener } = useAppLockStore();
    const { theme } = useAppTheme();

    useEffect(() => {
        return initAppStateListener();
    }, [initAppStateListener]);

    const handleUnlock = async () => {
        const ok = await unlock();
        if (!ok) {
            feedback.warning('Kimlik doğrulama başarısız.');
        }
    };

    const showLock = isAuthenticated && biometricLockEnabled && isLocked;

    return (
        <>
            {children}
            <Modal visible={showLock} animationType="fade" transparent={false}>
                <View style={[styles.lockScreen, { backgroundColor: theme.background }]}>
                    <Fingerprint size={56} color={theme.primary} />
                    <Text style={[styles.title, { color: theme.text }]}>Finans Kilitli</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Devam etmek için biyometrik doğrulama yapın
                    </Text>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={handleUnlock}
                    >
                        <Text style={styles.buttonText}>Kilidi Aç</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    lockScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: Spacing.md,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    button: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radius.xl,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
});
