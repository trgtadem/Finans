import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../src/store/useAuthStore';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../src/theme/useAppTheme';
import { setupNotifications } from '../src/utils/notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
    const { isAuthenticated } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();
    const { colorScheme, theme } = useAppTheme();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setupNotifications().catch(err => console.log('Notification setup failed', err));
        setIsReady(true);
    }, []);

    useEffect(() => {
        if (!isReady || !navigationState?.key) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/login');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, segments, navigationState?.key, isReady]);

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
        </GestureHandlerRootView>
    );
}
