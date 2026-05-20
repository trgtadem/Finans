import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CloudOff, RefreshCw } from 'lucide-react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../theme/useAppTheme';
import { Spacing, Radius } from '../theme';
import { isFirebaseConfigured } from '../config/firebase';

export function SyncStatusBanner() {
    const syncError = useFinanceStore((s) => s.syncError);
    const isSyncing = useFinanceStore((s) => s.isSyncing);
    const clearSyncError = useFinanceStore((s) => s.clearSyncError);
    const authMode = useAuthStore((s) => s.authMode);
    const user = useAuthStore((s) => s.user);
    const { theme } = useAppTheme();

    if (!isFirebaseConfigured() || authMode !== 'firebase' || !user?.uid) {
        return null;
    }

    if (!syncError && !isSyncing) return null;

    return (
        <View
            style={[
                styles.banner,
                {
                    backgroundColor: syncError ? `${theme.danger}18` : `${theme.primary}14`,
                    borderColor: syncError ? theme.danger : theme.primary,
                },
            ]}
        >
            {isSyncing ? (
                <ActivityIndicator size="small" color={theme.primary} />
            ) : (
                <CloudOff size={18} color={theme.danger} />
            )}
            <Text
                style={[
                    styles.text,
                    { color: syncError ? theme.danger : theme.textSecondary },
                ]}
                numberOfLines={2}
            >
                {syncError ?? 'Veriler senkronize ediliyor...'}
            </Text>
            {syncError && (
                <TouchableOpacity onPress={clearSyncError} style={styles.retryBtn}>
                    <RefreshCw size={16} color={theme.danger} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginHorizontal: Spacing.md,
        marginTop: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.md,
        borderWidth: 1,
    },
    text: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
    },
    retryBtn: {
        padding: 4,
    },
});
