import { useColorScheme } from 'react-native';
import { Colors } from './index';
import { AccentPreset, SurfaceStyle, useThemeStore } from '../store/useThemeStore';

const accentPresets: Record<AccentPreset, { light: string; dark: string }> = {
    blue: { light: '#2D6CDF', dark: '#4D8BFF' },
    emerald: { light: '#1C9C67', dark: '#39C98A' },
    sunset: { light: '#E56A2E', dark: '#FF995B' },
    violet: { light: '#7356D8', dark: '#9D88FF' },
    mono: { light: '#475569', dark: '#94A3B8' },
};

const surfacePresets: Record<
    SurfaceStyle,
    {
        light: { background: string; surface: string; border: string; cardShadow: string };
        dark: { background: string; surface: string; border: string; cardShadow: string };
    }
> = {
    soft: {
        light: {
            background: '#F5F7FB',
            surface: '#FFFFFF',
            border: '#E6EBF3',
            cardShadow: 'rgba(15, 23, 42, 0.06)',
        },
        dark: {
            background: '#0F131B',
            surface: '#171E2A',
            border: '#273245',
            cardShadow: 'rgba(0, 0, 0, 0.35)',
        },
    },
    balanced: {
        light: {
            background: '#F8F9FA',
            surface: '#FFFFFF',
            border: '#E9ECEF',
            cardShadow: 'rgba(0, 0, 0, 0.05)',
        },
        dark: {
            background: '#121212',
            surface: '#1E1E1E',
            border: '#2C2C2C',
            cardShadow: 'rgba(0, 0, 0, 0.3)',
        },
    },
    elevated: {
        light: {
            background: '#EEF2F8',
            surface: '#FFFFFF',
            border: '#D7DFEC',
            cardShadow: 'rgba(15, 23, 42, 0.14)',
        },
        dark: {
            background: '#0D1118',
            surface: '#1A2333',
            border: '#2B3A52',
            cardShadow: 'rgba(0, 0, 0, 0.5)',
        },
    },
};

function hexToRgba(hex: string, alpha: number) {
    const normalized = hex.replace('#', '');
    const fullHex =
        normalized.length === 3
            ? normalized
                .split('')
                .map((char) => char + char)
                .join('')
            : normalized;

    if (fullHex.length !== 6) {
        return `rgba(45,108,223,${alpha})`;
    }

    const parsed = Number.parseInt(fullHex, 16);
    if (Number.isNaN(parsed)) {
        return `rgba(45,108,223,${alpha})`;
    }

    const r = (parsed >> 16) & 255;
    const g = (parsed >> 8) & 255;
    const b = parsed & 255;

    return `rgba(${r},${g},${b},${alpha})`;
}

export function useAppTheme() {
    const systemScheme = useColorScheme() ?? 'light';
    const {
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
    } = useThemeStore();

    const colorScheme = themeMode === 'system' ? systemScheme : themeMode;
    const baseTheme = Colors[colorScheme];
    const surfacePreset = surfacePresets[surfaceStyle][colorScheme];
    const primary = accentPresets[accentPreset][colorScheme];
    const isDark = colorScheme === 'dark';

    const warning = isDark ? '#F6C76D' : '#A16207';
    const info = isDark ? '#7DD3FC' : '#0369A1';

    const text = contrastMode === 'high' ? (isDark ? '#FFFFFF' : '#101418') : baseTheme.text;
    const textSecondary = contrastMode === 'high' ? (isDark ? '#D5DFEF' : '#344256') : baseTheme.textSecondary;
    const border = contrastMode === 'high' ? (isDark ? '#42536D' : '#C4D0E1') : surfacePreset.border;

    const theme = {
        ...baseTheme,
        ...surfacePreset,
        primary,
        secondary: isDark ? '#BFCDE1' : '#5F6E84',
        text,
        textSecondary,
        border,
        warning,
        info,
        primarySoft: hexToRgba(primary, isDark ? 0.26 : 0.15),
        successSoft: hexToRgba(baseTheme.success, isDark ? 0.26 : 0.15),
        dangerSoft: hexToRgba(baseTheme.danger, isDark ? 0.26 : 0.15),
        warningSoft: hexToRgba(warning, isDark ? 0.26 : 0.15),
        infoSoft: hexToRgba(info, isDark ? 0.26 : 0.15),
    };

    if (usePureBlack && isDark) {
        theme.background = '#000000';
        theme.surface = '#0B0B0F';
        theme.border = contrastMode === 'high' ? '#3E4A5C' : '#1D2633';
        theme.cardShadow = 'rgba(0, 0, 0, 0.75)';
    }

    return {
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
    };
}
