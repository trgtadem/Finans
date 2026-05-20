import React, { useEffect, useRef } from 'react';
import {
    Text,
    StyleSheet,
    Pressable,
    View,
    Animated,
    Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react-native';
import { useToastStore, ToastType } from './store/useToastStore';
import { useAppTheme } from '../../theme/useAppTheme';
import { Radius, Spacing } from '../../theme';

const ICONS: Record<ToastType, typeof Info> = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
};

export function Toast() {
    const toast = useToastStore((s) => s.toast);
    const hide = useToastStore((s) => s.hide);
    const { theme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (toast) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 80,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -120,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [toast?.id, translateY, opacity]);

    if (!toast) return null;

    const Icon = ICONS[toast.type];
    const accent =
        toast.type === 'success'
            ? theme.success
            : toast.type === 'error'
              ? theme.danger
              : toast.type === 'warning'
                ? '#F59E0B'
                : theme.primary;

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[
                styles.wrapper,
                { top: insets.top + Spacing.sm },
                { transform: [{ translateY }], opacity },
            ]}
        >
            <Pressable
                onPress={hide}
                style={[
                    styles.toast,
                    {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        shadowColor: theme.cardShadow,
                    },
                ]}
            >
                <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
                    <Icon size={22} color={accent} />
                </View>
                <Text style={[styles.message, { color: theme.text }]} numberOfLines={3}>
                    {toast.message}
                </Text>
                <Pressable onPress={hide} hitSlop={12} style={styles.closeBtn}>
                    <X size={18} color={theme.textSecondary} />
                </Pressable>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: Spacing.md,
        right: Spacing.md,
        zIndex: 9999,
        elevation: 20,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
        gap: Spacing.sm,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    message: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 20,
    },
    closeBtn: {
        padding: 4,
    },
});
