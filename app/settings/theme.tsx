import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Monitor,
    Sun,
    Moon,
    Palette,
    Contrast as ContrastIcon,
    Layers,
    RotateCcw,
    Sparkles,
    Droplets,
} from 'lucide-react-native';
import { Spacing, Radius } from '../../src/theme';
import { useAppTheme } from '../../src/theme/useAppTheme';
import {
    AccentPreset,
    ContrastMode,
    SurfaceStyle,
    ThemeMode,
} from '../../src/store/useThemeStore';

const modeOptions: Array<{
    value: ThemeMode;
    label: string;
    Icon: React.ComponentType<{ size?: number; color?: string }>;
}> = [
    { value: 'system', label: 'Sistem', Icon: Monitor },
    { value: 'light', label: 'Açık', Icon: Sun },
    { value: 'dark', label: 'Koyu', Icon: Moon },
];

const accentOptions: Array<{ value: AccentPreset; label: string; preview: string }> = [
    { value: 'blue', label: 'Ocean', preview: '#2D6CDF' },
    { value: 'emerald', label: 'Mint', preview: '#1C9C67' },
    { value: 'sunset', label: 'Sunset', preview: '#E56A2E' },
    { value: 'violet', label: 'Aurora', preview: '#7356D8' },
    { value: 'mono', label: 'Slate', preview: '#64748B' },
];

const contrastOptions: Array<{ value: ContrastMode; label: string; description: string }> = [
    { value: 'standard', label: 'Standart', description: 'Dengeli kontrast' },
    { value: 'high', label: 'Yüksek', description: 'Daha keskin metinler' },
];

const surfaceOptions: Array<{ value: SurfaceStyle; label: string; description: string }> = [
    { value: 'soft', label: 'Soft', description: 'Yumuşak yüzey geçişleri' },
    { value: 'balanced', label: 'Balanced', description: 'Klasik ve dengeli görünüm' },
    { value: 'elevated', label: 'Elevated', description: 'Daha belirgin kart katmanları' },
];

export default function ThemeSettingsScreen() {
    const router = useRouter();
    const {
        theme,
        colorScheme,
        themeMode,
        accentPreset,
        contrastMode,
        surfaceStyle,
        usePureBlack,
        setThemeMode,
        setAccentPreset,
        setContrastMode,
        setSurfaceStyle,
        setUsePureBlack,
        resetThemeSettings,
    } = useAppTheme();

    const isDark = colorScheme === 'dark';

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}> 
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Tema Ayarları</Text>
            </View>

            <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.heroIcon, { backgroundColor: theme.primarySoft }]}>
                    <Sparkles size={20} color={theme.primary} />
                </View>
                <Text style={[styles.heroTitle, { color: theme.text }]}>Kişiselleştirilmiş Görünüm</Text>
                <Text style={[styles.heroText, { color: theme.textSecondary }]}>Mod, vurgu rengi, yüzey stili ve kontrastı kombinleyerek kendi arayüz stilini oluştur.</Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Görünüm Modu</Text>
                <View style={[styles.segmentCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {modeOptions.map((option) => {
                        const isSelected = themeMode === option.value;

                        return (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.segmentButton,
                                    {
                                        backgroundColor: isSelected ? theme.primary : theme.background,
                                        borderColor: isSelected ? theme.primary : theme.border,
                                    },
                                ]}
                                onPress={() => setThemeMode(option.value)}
                            >
                                <option.Icon size={16} color={isSelected ? '#FFF' : theme.textSecondary} />
                                <Text style={[styles.segmentText, { color: isSelected ? '#FFF' : theme.text }]}>{option.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Palette size={18} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Vurgu Rengi</Text>
                </View>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.accentGrid}>
                        {accentOptions.map((option) => {
                            const isSelected = accentPreset === option.value;

                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.accentOption,
                                        {
                                            backgroundColor: isSelected ? theme.primarySoft : theme.background,
                                            borderColor: isSelected ? theme.primary : theme.border,
                                        },
                                    ]}
                                    onPress={() => setAccentPreset(option.value)}
                                >
                                    <View style={[styles.colorDot, { backgroundColor: option.preview }]} />
                                    <Text style={[styles.accentLabel, { color: theme.text }]}>{option.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <ContrastIcon size={18} color={theme.warning} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Kontrast</Text>
                </View>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {contrastOptions.map((option) => {
                        const isSelected = contrastMode === option.value;

                        return (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.rowOption,
                                    {
                                        backgroundColor: isSelected ? theme.primarySoft : theme.background,
                                        borderColor: isSelected ? theme.primary : theme.border,
                                    },
                                ]}
                                onPress={() => setContrastMode(option.value)}
                            >
                                <Text style={[styles.rowOptionTitle, { color: theme.text }]}>{option.label}</Text>
                                <Text style={[styles.rowOptionDescription, { color: theme.textSecondary }]}>{option.description}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Layers size={18} color={theme.info} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Yüzey Stili</Text>
                </View>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {surfaceOptions.map((option) => {
                        const isSelected = surfaceStyle === option.value;

                        return (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.rowOption,
                                    {
                                        backgroundColor: isSelected ? theme.primarySoft : theme.background,
                                        borderColor: isSelected ? theme.primary : theme.border,
                                    },
                                ]}
                                onPress={() => setSurfaceStyle(option.value)}
                            >
                                <Text style={[styles.rowOptionTitle, { color: theme.text }]}>{option.label}</Text>
                                <Text style={[styles.rowOptionDescription, { color: theme.textSecondary }]}>{option.description}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Droplets size={18} color={theme.textSecondary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Gelişmiş</Text>
                </View>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.switchRow, { borderColor: theme.border }]}> 
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.switchTitle, { color: theme.text }]}>Saf Siyah Modu</Text>
                            <Text style={[styles.switchDescription, { color: theme.textSecondary }]}>OLED ekranlarda koyu mod için daha derin siyah arka plan uygular.</Text>
                        </View>
                        <Switch
                            value={usePureBlack}
                            onValueChange={setUsePureBlack}
                            trackColor={{ false: theme.border, true: theme.primarySoft }}
                            thumbColor={usePureBlack ? theme.primary : theme.surface}
                        />
                    </View>
                    {!isDark ? (
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>Saf Siyah Modu yalnızca koyu tema aktifken görünür etki eder.</Text>
                    ) : null}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Canlı Önizleme</Text>
                <View
                    style={[
                        styles.previewCard,
                        {
                            backgroundColor: theme.surface,
                            borderColor: theme.border,
                            shadowColor: theme.cardShadow,
                        },
                    ]}
                >
                    <View style={styles.previewTopRow}>
                        <View style={[styles.previewChip, { backgroundColor: theme.primarySoft }]}>
                            <Text style={[styles.previewChipText, { color: theme.primary }]}>Bütçe</Text>
                        </View>
                        <Text style={[styles.previewAmount, { color: theme.success }]}>+12.450 TL</Text>
                    </View>
                    <Text style={[styles.previewTitle, { color: theme.text }]}>Aylık görünüm dengeli</Text>
                    <Text style={[styles.previewSubTitle, { color: theme.textSecondary }]}>Bu kart mevcut ayarlarının uygulama içindeki yansımasını gösterir.</Text>
                    <View style={styles.previewFooter}>
                        <View style={[styles.previewBadge, { backgroundColor: theme.warningSoft }]}>
                            <Text style={[styles.previewBadgeText, { color: theme.warning }]}>Hatırlatıcı</Text>
                        </View>
                        <View style={[styles.previewBadge, { backgroundColor: theme.infoSoft }]}>
                            <Text style={[styles.previewBadgeText, { color: theme.info }]}>Takvim</Text>
                        </View>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={[styles.resetButton, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={resetThemeSettings}>
                <RotateCcw size={18} color={theme.textSecondary} />
                <Text style={[styles.resetButtonText, { color: theme.text }]}>Varsayılan Tema Ayarlarına Dön</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
    },
    backBtn: {
        marginRight: Spacing.md,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    heroCard: {
        margin: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        borderWidth: 1,
    },
    heroIcon: {
        width: 36,
        height: 36,
        borderRadius: Radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: Spacing.xs,
    },
    heroText: {
        fontSize: 14,
        lineHeight: 20,
    },
    section: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: Spacing.sm,
    },
    segmentCard: {
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Spacing.sm,
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    segmentButton: {
        flex: 1,
        height: 48,
        borderRadius: Radius.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '600',
    },
    card: {
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    accentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    accentOption: {
        width: '48%',
        borderWidth: 1,
        borderRadius: Radius.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: Radius.full,
    },
    accentLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    rowOption: {
        borderWidth: 1,
        borderRadius: Radius.md,
        padding: Spacing.md,
    },
    rowOptionTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    rowOptionDescription: {
        fontSize: 12,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: Spacing.sm,
        marginBottom: Spacing.sm,
        borderBottomWidth: 1,
        gap: Spacing.sm,
    },
    switchTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    switchDescription: {
        fontSize: 12,
        lineHeight: 18,
    },
    infoText: {
        fontSize: 12,
        lineHeight: 18,
    },
    previewCard: {
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    previewTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    previewChip: {
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    previewChipText: {
        fontWeight: '700',
        fontSize: 12,
    },
    previewAmount: {
        fontSize: 14,
        fontWeight: '700',
    },
    previewTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: Spacing.xs,
    },
    previewSubTitle: {
        fontSize: 13,
        lineHeight: 19,
    },
    previewFooter: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    previewBadge: {
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    previewBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    resetButton: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
        height: 52,
        borderRadius: Radius.lg,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    resetButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
