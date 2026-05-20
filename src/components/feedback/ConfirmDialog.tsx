import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
} from 'react-native';
import { useConfirmStore } from './store/useConfirmStore';
import { useAppTheme } from '../../theme/useAppTheme';
import { Radius, Spacing } from '../../theme';

export function ConfirmDialog() {
    const {
        visible,
        title,
        message,
        confirmText,
        cancelText,
        destructive,
        onConfirm,
        onCancel,
        hide,
    } = useConfirmStore();
    const { theme } = useAppTheme();

    const handleCancel = () => {
        hide();
        onCancel?.();
    };

    const handleConfirm = () => {
        hide();
        onConfirm();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
            <Pressable style={styles.overlay} onPress={handleCancel}>
                <Pressable
                    style={[styles.card, { backgroundColor: theme.surface }]}
                    onPress={(e) => e.stopPropagation()}
                >
                    <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                    <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.btn, styles.cancelBtn, { borderColor: theme.border }]}
                            onPress={handleCancel}
                        >
                            <Text style={[styles.cancelText, { color: theme.text }]}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.btn,
                                { backgroundColor: destructive ? theme.danger : theme.primary },
                            ]}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: Spacing.sm,
    },
    message: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: Spacing.lg,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    btn: {
        flex: 1,
        height: 48,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        borderWidth: 1,
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
    },
    confirmText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
});
