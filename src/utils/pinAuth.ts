export const PIN_LENGTH = 6;

export function sanitizePinInput(value: string): string {
    return value.replace(/\D/g, '').slice(0, PIN_LENGTH);
}

export function isValidPin(pin: string): boolean {
    return /^\d{6}$/.test(pin);
}

export function pinValidationMessage(pin: string): string | null {
    if (pin.length === 0) return '6 haneli şifrenizi girin.';
    if (pin.length < PIN_LENGTH) return 'Şifre tam 6 rakam olmalıdır.';
    if (!/^\d+$/.test(pin)) return 'Şifre yalnızca rakam içermelidir.';
    return null;
}
