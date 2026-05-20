import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../src/store/useAuthStore';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../src/theme/useAppTheme';
import { setupNotifications } from '../src/utils/notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFirebaseSync } from '../src/hooks/useFirebaseSync';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { isFirebaseConfigured } from '../src/config/firebase';
import { useFinanceStore } from '../src/store/useFinanceStore';
import { FeedbackRoot } from '../src/components/feedback';
import { migrateLegacyLocalPin } from '../src/store/useAuthStore';
import { logCatch } from '../src/utils/logger';

export default function RootLayout() {
    const { isAuthenticated, isLoading, initialize, user, authMode } = useAuthStore();
    const isCloudDataReady = useFinanceStore((s) => s.isCloudDataReady);
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();
    const { colorScheme, theme } = useAppTheme();
    const [isReady, setIsReady] = useState(false);

    useFirebaseSync();

    useEffect(() => {
        migrateLegacyLocalPin().catch(logCatch('pin_migration'));
        const unsubscribeAuth = initialize();
        setupNotifications().catch(logCatch('notifications'));
        setIsReady(true);
        return unsubscribeAuth;
    }, [initialize]);

    useEffect(() => {
        if (!isReady || !navigationState?.key || isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/login');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, segments, navigationState?.key, isReady, isLoading]);

    const waitingForCloudData =
        isFirebaseConfigured() &&
        authMode === 'firebase' &&
        isAuthenticated &&
        !!user?.uid &&
        !isCloudDataReady;

    if (!isReady || (isFirebaseConfigured() && isLoading) || waitingForCloudData) {
        return (
            <View style={[styles.loading, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                {waitingForCloudData && (
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                        Verileriniz yükleniyor...
                    </Text>
                )}
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.background },
                }}
            >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="transaction/add"
                    options={{
                        presentation: 'modal',
                        headerShown: true,
                        title: 'Yeni İşlem',
                        headerStyle: { backgroundColor: theme.surface },
                        headerTitleStyle: { color: theme.text },
                        headerTintColor: theme.primary,
                    }}
                />
            </Stack>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <FeedbackRoot />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        marginTop: 8,
    },
});
