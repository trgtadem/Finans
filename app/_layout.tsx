import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuthStore } from '../src/store/useAuthStore';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../src/theme/useAppTheme';
import { setupNotifications } from '../src/utils/notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFirebaseSync } from '../src/hooks/useFirebaseSync';
import { useSyncLifecycle } from '../src/hooks/useSyncLifecycle';
import { useAutoCloudUpload } from '../src/hooks/useAutoCloudUpload';
import { FeedbackRoot } from '../src/components/feedback';
import { migrateLegacyLocalPin } from '../src/store/useAuthStore';
import { logCatch } from '../src/utils/logger';
import { AppLockGate } from '../src/components/AppLockGate';
import { useFinanceStore } from '../src/store/useFinanceStore';
import { syncLocalReminderNotifications } from '../src/services/notifications/reconcileReminders';
import { BrandSplash } from '../src/components/brand/BrandSplash';
import { BRAND_BLUE } from '../src/components/brand/BrandMark';
import { useAppBootGate } from '../src/hooks/useAppBootGate';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {
    // ignore — already hidden or native splash unavailable
});

export default function RootLayout() {
    const { isAuthenticated, isLoading, initialize } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();
    const { colorScheme, theme } = useAppTheme();
    const [isReady, setIsReady] = useState(false);
    const [splashGone, setSplashGone] = useState(false);
    const { canEnterApp, onAnimationFinished } = useAppBootGate(isReady, isLoading);

    useFirebaseSync();
    useSyncLifecycle();
    useAutoCloudUpload();

    useEffect(() => {
        migrateLegacyLocalPin().catch(logCatch('pin_migration'));
        const unsubscribeAuth = initialize();
        setupNotifications().catch(logCatch('notifications'));
        setIsReady(true);
        return unsubscribeAuth;
    }, [initialize]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const reconcile = async () => {
            try {
                const updates = await syncLocalReminderNotifications(
                    useFinanceStore.getState().reminders
                );
                useFinanceStore.getState().applyReminderSchedules(updates);
            } catch (e) {
                logCatch('notifications')(e);
            }
        };

        if (useFinanceStore.persist.hasHydrated()) {
            reconcile();
        }
        return useFinanceStore.persist.onFinishHydration(() => {
            reconcile();
        });
    }, [isAuthenticated]);

    useEffect(() => {
        if (!canEnterApp || !navigationState?.key) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/login');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, segments, navigationState?.key, canEnterApp, router]);

    const showApp = canEnterApp;
    const showSplash = !splashGone;

    return (
        <GestureHandlerRootView
            style={[
                styles.root,
                { backgroundColor: showApp ? theme.background : BRAND_BLUE },
            ]}
        >
            {showApp && (
                <View style={[styles.appLayer, { backgroundColor: theme.background }]}>
                    <AppLockGate>
                        <Stack
                            screenOptions={{
                                headerShown: false,
                                animation: 'fade',
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
                            <Stack.Screen
                                name="transaction/edit"
                                options={{
                                    presentation: 'modal',
                                    headerShown: true,
                                    title: 'İşlemi Düzenle',
                                    headerStyle: { backgroundColor: theme.surface },
                                    headerTitleStyle: { color: theme.text },
                                    headerTintColor: theme.primary,
                                }}
                            />
                        </Stack>
                    </AppLockGate>
                    <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                    <FeedbackRoot />
                </View>
            )}

            {showSplash && (
                <BrandSplash
                    onAnimationFinished={onAnimationFinished}
                    fadingOut={canEnterApp}
                    onFadeOutComplete={() => setSplashGone(true)}
                />
            )}

            {!showApp && <StatusBar style="light" />}
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    appLayer: {
        flex: 1,
    },
});
