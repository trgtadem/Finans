import { doc, setDoc } from 'firebase/firestore';
import { isExpoGo } from '../notifications/notificationsBridge';
import { Platform } from 'react-native';
import { getFirebaseDb, isFirebaseConfigured } from '../../config/firebase';

/**
 * Uzak FCM push — Expo Go'da desteklenmez (yalnızca development build).
 * Yerel hatırlatıcılar expo-notifications ile ayrıca çalışır.
 */
export async function registerForPushNotifications(): Promise<string | null> {
    if (isExpoGo()) {
        return null;
    }

    const Device = await import('expo-device');
    if (!Device.isDevice) {
        return null;
    }

    const Notifications = await import('expo-notifications');

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Hatırlatıcılar',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
        });
    }

    try {
        const tokenData = await Notifications.getDevicePushTokenAsync();
        return tokenData.data;
    } catch {
        return null;
    }
}

export async function savePushTokenToFirestore(
    userId: string,
    token: string
): Promise<void> {
    if (!isFirebaseConfigured()) return;
    const db = getFirebaseDb();
    if (!db) return;

    await setDoc(
        doc(db, 'users', userId),
        {
            pushToken: token,
            pushTokenUpdatedAt: new Date().toISOString(),
            platform: Platform.OS,
        },
        { merge: true }
    );
}
