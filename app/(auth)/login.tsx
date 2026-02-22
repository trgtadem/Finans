import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors, Spacing, Radius } from '../../src/theme';
import { Lock, ArrowRight } from 'lucide-react-native';

export default function LoginScreen() {
    const [input, setInput] = useState('');
    const { login, setPassword, password } = useAuthStore();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const handlePress = () => {
        if (!password) {
            // First time setup
            if (input.length >= 4) {
                setPassword(input);
            }
        } else {
            if (!login(input)) {
                alert('Hatalı şifre!');
            }
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
                    <Lock size={40} color={theme.primary} />
                </View>

                <Text style={[styles.title, { color: theme.text }]}>
                    {!password ? 'Şifre Belirleyin' : 'Hoş Geldiniz'}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    {!password
                        ? 'Uygulamaya giriş için en az 4 haneli bir şifre belirleyin.'
                        : 'Devam etmek için şifrenizi girin.'
                    }
                </Text>

                <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Şifre"
                        placeholderTextColor={theme.textSecondary}
                        secureTextEntry
                        keyboardType="number-pad"
                        value={input}
                        onChangeText={setInput}
                        maxLength={8}
                    />
                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: theme.primary }]}
                        onPress={handlePress}
                    >
                        <ArrowRight size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: Spacing.sm,
    },
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
        paddingLeft: Spacing.lg,
        width: '100%',
        height: 64,
    },
    input: {
        flex: 1,
        fontSize: 20,
        letterSpacing: 8,
    },
    submitButton: {
        width: 48,
        height: 48,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    }
});
