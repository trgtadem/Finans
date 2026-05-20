import * as SecureStore from 'expo-secure-store';

const LOCAL_PIN_KEY = 'finans_local_pin';

export async function saveLocalPin(pin: string): Promise<void> {
    await SecureStore.setItemAsync(LOCAL_PIN_KEY, pin);
}

export async function getLocalPin(): Promise<string | null> {
    return SecureStore.getItemAsync(LOCAL_PIN_KEY);
}

export async function hasLocalPin(): Promise<boolean> {
    const pin = await getLocalPin();
    return pin != null && pin.length > 0;
}

export async function verifyLocalPin(pin: string): Promise<boolean> {
    const stored = await getLocalPin();
    return stored === pin;
}

export async function clearLocalPin(): Promise<void> {
    await SecureStore.deleteItemAsync(LOCAL_PIN_KEY);
}
