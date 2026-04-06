import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';
export type AccentPreset = 'blue' | 'emerald' | 'sunset' | 'violet' | 'mono';
export type ContrastMode = 'standard' | 'high';
export type SurfaceStyle = 'soft' | 'balanced' | 'elevated';

interface ThemeState {
    themeMode: ThemeMode;
    accentPreset: AccentPreset;
    contrastMode: ContrastMode;
    surfaceStyle: SurfaceStyle;
    usePureBlack: boolean;
    setThemeMode: (mode: ThemeMode) => void;
    setAccentPreset: (preset: AccentPreset) => void;
    setContrastMode: (mode: ContrastMode) => void;
    setSurfaceStyle: (style: SurfaceStyle) => void;
    setUsePureBlack: (enabled: boolean) => void;
    resetThemeSettings: () => void;
}

const defaultThemeSettings = {
    themeMode: 'system' as ThemeMode,
    accentPreset: 'blue' as AccentPreset,
    contrastMode: 'standard' as ContrastMode,
    surfaceStyle: 'soft' as SurfaceStyle,
    usePureBlack: false,
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            ...defaultThemeSettings,
            setThemeMode: (mode) => set({ themeMode: mode }),
            setAccentPreset: (preset) => set({ accentPreset: preset }),
            setContrastMode: (mode) => set({ contrastMode: mode }),
            setSurfaceStyle: (style) => set({ surfaceStyle: style }),
            setUsePureBlack: (enabled) => set({ usePureBlack: enabled }),
            resetThemeSettings: () => set(defaultThemeSettings),
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
