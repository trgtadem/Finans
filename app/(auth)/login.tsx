import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Spacing, Radius } from '../../src/theme';
import { Lock, ArrowRight, Mail } from 'lucide-react-native';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { isFirebaseConfigured } from '../../src/config/firebase';
import {
    sanitizePinInput,
    pinValidationMessage,
    PIN_LENGTH,
} from '../../src/utils/pinAuth';
import { feedback } from '../../src/components/feedback';

const LAST_EMAIL_KEY = 'finans-last-login-email';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [localPin, setLocalPin] = useState('');
    const [localConfirmPin, setLocalConfirmPin] = useState('');
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        login,
        setPassword,
        hasLocalPinSetup,
        checkLocalPinSetup,
        loginWithEmail,
        registerWithEmail,
        sendPasswordReset,
        clearAuthError,
    } = useAuthStore();
    const { theme } = useAppTheme();

    const useFirebase = isFirebaseConfigured();

    useEffect(() => {
        if (useFirebase) {
            AsyncStorage.getItem(LAST_EMAIL_KEY).then((saved) => {
                if (saved) setEmail(saved);
            });
        } else {
            checkLocalPinSetup();
        }
    }, [useFirebase, checkLocalPinSetup]);

    const handleFirebaseSubmit = async () => {
        if (!email.trim()) {
            feedback.error('E-posta adresinizi girin.');
            return;
        }

        const pinError = pinValidationMessage(pin);
        if (pinError) {
            feedback.error(pinError);
            return;
        }

        if (isRegisterMode && pin !== confirmPin) {
            feedback.error('Şifreler eşleşmiyor. Lütfen tekrar kontrol edin.');
            return;
        }

        setIsSubmitting(true);
        clearAuthError();

        const success = isRegisterMode
            ? await registerWithEmail(email, pin)
            : await loginWithEmail(email, pin);

        setIsSubmitting(false);

        if (!success) {
            const message = useAuthStore.getState().authError;
            if (message) feedback.error(message);
        } else {
            await AsyncStorage.setItem(LAST_EMAIL_KEY, email.trim().toLowerCase());
            if (isRegisterMode) {
                feedback.success('Hesabınız oluşturuldu!');
            }
        }
    };

    const handleLocalSubmit = async () => {
        const pinError = pinValidationMessage(localPin);
        if (pinError) {
            feedback.error(pinError);
            return;
        }

        if (!hasLocalPinSetup) {
            if (localPin !== localConfirmPin) {
                feedback.error('Şifreler eşleşmiyor.');
                return;
            }
            await setPassword(localPin);
            feedback.success('Şifreniz kaydedildi.');
            return;
        }

        const ok = await login(localPin);
        if (!ok) {
            feedback.error('Hatalı şifre!');
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            feedback.info('Şifre sıfırlama için önce e-posta adresinizi girin.');
            return;
        }
        try {
            await sendPasswordReset(email);
            feedback.success('Şifre sıfırlama bağlantısı e-postanıza gönderildi.');
        } catch {
            const message = useAuthStore.getState().authError;
            if (message) feedback.error(message);
        }
    };

    const switchMode = () => {
        clearAuthError();
        setPin('');
        setConfirmPin('');
        setIsRegisterMode(!isRegisterMode);
    };

    const renderPinInput = (
        value: string,
        onChange: (v: string) => void,
        placeholder: string,
        options?: { onSubmit?: () => void; showSubmit?: boolean }
    ) => (
        <View
            style={[
                styles.inputContainer,
                { backgroundColor: theme.surface, borderColor: theme.border, marginTop: Spacing.md },
            ]}
        >
            <TextInput
                style={[styles.input, styles.pinInput, { color: theme.text }]}
                placeholder={placeholder}
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={PIN_LENGTH}
                value={value}
                onChangeText={(t) => onChange(sanitizePinInput(t))}
                onSubmitEditing={options?.onSubmit}
                returnKeyType="done"
            />
            {options?.showSubmit && options?.onSubmit && (
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        { backgroundColor: theme.primary, opacity: isSubmitting ? 0.6 : 1 },
                    ]}
                    onPress={options.onSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <ArrowRight size={24} color="#FFF" />
                    )}
                </TouchableOpacity>
            )}
        </View>
    );

    if (useFirebase) {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.container, { backgroundColor: theme.background }]}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
                        <Mail size={40} color={theme.primary} />
                    </View>

                    <Text style={[styles.title, { color: theme.text }]}>
                        {isRegisterMode ? 'Hesap Oluştur' : 'Giriş Yap'}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {isRegisterMode
                            ? 'E-posta ve 6 haneli şifrenizle kayıt olun.'
                            : 'E-posta ve 6 haneli şifrenizle giriş yapın.'}
                    </Text>

                    <View
                        style={[
                            styles.inputContainer,
                            { backgroundColor: theme.surface, borderColor: theme.border },
                        ]}
                    >
                        <Mail size={20} color={theme.textSecondary} style={styles.fieldIcon} />
                        <TextInput
                            style={[styles.input, styles.inputNormal, { color: theme.text }]}
                            placeholder="E-posta adresi"
                            placeholderTextColor={theme.textSecondary}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            textContentType="emailAddress"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    {renderPinInput(pin, setPin, '6 haneli şifre', {
                        showSubmit: !isRegisterMode,
                        onSubmit: handleFirebaseSubmit,
                    })}

                    {isRegisterMode &&
                        renderPinInput(confirmPin, setConfirmPin, 'Şifre tekrar')}

                    {isRegisterMode && (
                        <TouchableOpacity
                            style={[
                                styles.mainButton,
                                { backgroundColor: theme.primary, opacity: isSubmitting ? 0.6 : 1 },
                            ]}
                            onPress={handleFirebaseSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.mainButtonText}>Kayıt Ol</Text>
                            )}
                        </TouchableOpacity>
                    )}

                    {!isRegisterMode && (
                        <TouchableOpacity
                            style={[
                                styles.mainButton,
                                { backgroundColor: theme.primary, opacity: isSubmitting ? 0.6 : 1 },
                            ]}
                            onPress={handleFirebaseSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.mainButtonText}>Giriş Yap</Text>
                            )}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.linkButton} onPress={switchMode}>
                        <Text style={[styles.linkText, { color: theme.primary }]}>
                            {isRegisterMode
                                ? 'Zaten hesabınız var mı? Giriş yapın'
                                : 'Hesabınız yok mu? Kayıt olun'}
                        </Text>
                    </TouchableOpacity>

                    {!isRegisterMode && (
                        <TouchableOpacity style={styles.linkButton} onPress={handleForgotPassword}>
                            <Text style={[styles.linkText, { color: theme.textSecondary }]}>
                                Şifremi unuttum
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    const isLocalSetup = !hasLocalPinSetup;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
                    <Lock size={40} color={theme.primary} />
                </View>

                <Text style={[styles.title, { color: theme.text }]}>
                    {isLocalSetup ? 'Şifre Belirleyin' : 'Hoş Geldiniz'}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    {isLocalSetup
                        ? '6 haneli bir şifre belirleyin ve tekrar girin.'
                        : '6 haneli şifrenizle devam edin (çevrimdışı mod).'}
                </Text>

                {renderPinInput(localPin, setLocalPin, '6 haneli şifre', {
                    showSubmit: !isLocalSetup,
                    onSubmit: handleLocalSubmit,
                })}

                {isLocalSetup && renderPinInput(localConfirmPin, setLocalConfirmPin, 'Şifre tekrar')}

                {isLocalSetup ? (
                    <TouchableOpacity
                        style={[styles.mainButton, { backgroundColor: theme.primary }]}
                        onPress={handleLocalSubmit}
                    >
                        <Text style={styles.mainButtonText}>Kaydet</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.mainButton, { backgroundColor: theme.primary }]}
                        onPress={handleLocalSubmit}
                    >
                        <Text style={styles.mainButtonText}>Giriş Yap</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        padding: Spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: Spacing.sm },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.lg,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radius.lg,
        borderWidth: 1,
        paddingLeft: Spacing.md,
        width: '100%',
        minHeight: 64,
    },
    fieldIcon: { marginRight: Spacing.sm },
    input: { flex: 1, fontSize: 16 },
    inputNormal: { fontSize: 16, paddingVertical: Spacing.md },
    pinInput: { fontSize: 22, letterSpacing: 6, textAlign: 'center' },
    submitButton: {
        width: 48,
        height: 48,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    mainButton: {
        width: '100%',
        height: 52,
        borderRadius: Radius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    mainButtonText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
    linkButton: { marginTop: Spacing.lg, padding: Spacing.sm },
    linkText: { fontSize: 14, fontWeight: '600' },
});
