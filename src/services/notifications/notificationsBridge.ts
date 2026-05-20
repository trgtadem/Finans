import Constants from 'expo-constants';

type NotificationsModule = typeof import('expo-notifications');

let handlerConfigured = false;

/** Expo Go'da uzak push modül yüklemesi uygulamayı çökertir. */
export function isExpoGo(): boolean {
    return Constants.appOwnership === 'expo';
}

export async function getNotificationsModule(): Promise<NotificationsModule | null> {
    if (isExpoGo()) {
        return null;
    }
    try {
        return await import('expo-notifications');
    } catch {
        return null;
    }
}

export async function ensureNotificationHandler(): Promise<void> {
    if (handlerConfigured) return;
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
    handlerConfigured = true;
}
