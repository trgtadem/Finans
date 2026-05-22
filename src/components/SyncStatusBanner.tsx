import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Cloud, CloudOff, RefreshCw, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../theme/useAppTheme';
import { Spacing, Radius } from '../theme';
import { isFirebaseConfigured } from '../config/firebase';
import { syncNowPending } from '../hooks/useFirebaseSync';
import { logCatch } from '../utils/logger';

export function SyncStatusBanner() {
    const syncError = useFinanceStore((s) => s.syncError);
    const isSyncing = useFinanceStore((s) => s.isSyncing);
    const hasPendingCloudSync = useFinanceStore((s) => s.hasPendingCloudSync);
    const lastSyncAt = useFinanceStore((s) => s.lastSyncAt);
    const clearSyncError = useFinanceStore((s) => s.clearSyncError);
    const authMode = useAuthStore((s) => s.authMode);
    const user = useAuthStore((s) => s.user);
    const { theme } = useAppTheme();

    if (!isFirebaseConfigured() || authMode !== 'firebase' || !user?.uid) {
        return null;
    }

    const showBanner = syncError || isSyncing || hasPendingCloudSync;
    if (!showBanner) return null;

    const statusText = syncError
        ? syncError
        : isSyncing
          ? 'Kaydediliyor…'
          : hasPendingCloudSync
            ? 'Bekleyen değişiklikler var'
            : '';

    const subText =
        !syncError && lastSyncAt
            ? `Son senkron: ${format(new Date(lastSyncAt), 'd MMM HH:mm', { locale: tr })}`
            : null;

    const handleRetry = () => {
        if (syncError) {
            clearSyncError();
        }
        syncNowPending().catch(logCatch('firebase_sync'));
    };

    return (
        <View
            style={[
                styles.banner,
                {
                    backgroundColor: syncError
                        ? `${theme.danger}18`
                        : hasPendingCloudSync
                          ? `${theme.secondary}14`
                          : `${theme.primary}14`,
                    borderColor: syncError
                        ? theme.danger
                        : hasPendingCloudSync
                          ? theme.secondary
                          : theme.primary,
                },
            ]}
        >
            {isSyncing ? (
                <ActivityIndicator size="small" color={theme.primary} />
            ) : syncError ? (
                <CloudOff size={18} color={theme.danger} />
            ) : hasPendingCloudSync ? (
                <Clock size={18} color={theme.secondary} />
            ) : (
                <Cloud size={18} color={theme.primary} />
            )}
            <View style={styles.textBlock}>
                <Text
                    style={[
                        styles.text,
                        {
                            color: syncError
                                ? theme.danger
                                : hasPendingCloudSync
                                  ? theme.text
                                  : theme.textSecondary,
                        },
                    ]}
                    numberOfLines={2}
                >
                    {statusText}
                </Text>
                {subText && !isSyncing && (
                    <Text style={[styles.subText, { color: theme.textSecondary }]}>
                        {subText}
                    </Text>
                )}
            </View>
            {(syncError || hasPendingCloudSync) && (
                <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
                    <RefreshCw size={16} color={syncError ? theme.danger : theme.primary} />
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
    textBlock: {
        flex: 1,
    },
    text: {
        fontSize: 13,
        fontWeight: '500',
    },
    subText: {
        fontSize: 11,
        marginTop: 2,
    },
    retryBtn: {
        padding: 4,
    },
});
