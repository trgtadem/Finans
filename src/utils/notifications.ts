// Notification system disabled for stability in Expo Go (SDK 53+)
// Push notification imports currently cause boot errors in the user's environment.

export async function setupNotifications() {
    console.log('Notifications are currently disabled for compatibility.');
    return false;
}

export async function scheduleLocalNotification(title: string, body: string, date: Date) {
    console.log(`Notification would have been scheduled: ${title} - ${body} at ${date}`);
    return null;
}
