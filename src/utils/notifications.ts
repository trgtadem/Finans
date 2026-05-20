import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { getNotificationsModule, ensureNotificationHandler } from '../services/notifications/notificationsBridge';

export async function setupNotifications(): Promise<boolean> {
    if (!Device.isDevice && Platform.OS !== 'web') {
        return false;
    }

    const Notifications = await getNotificationsModule();
    if (!Notifications) {
        return false;
    }

    await ensureNotificationHandler();

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync('reminders', {
                name: 'Hatırlatıcılar',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
            });
        } catch {
            // ignore
        }
    }

    return finalStatus === 'granted';
}
