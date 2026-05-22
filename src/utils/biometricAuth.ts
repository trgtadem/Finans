import * as LocalAuthentication from 'expo-local-authentication';

export async function getBiometricSupport(): Promise<{
    available: boolean;
    enrolled: boolean;
    label: string;
}> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    let label = 'Biyometrik';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        label = 'Yüz tanıma';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        label = 'Parmak izi';
    }
    return { available: compatible, enrolled, label };
}

export async function authenticateWithBiometric(prompt: string): Promise<boolean> {
    const { available, enrolled } = await getBiometricSupport();
    if (!available || !enrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: prompt,
        cancelLabel: 'İptal',
        disableDeviceFallback: false,
    });
    return result.success;
}
