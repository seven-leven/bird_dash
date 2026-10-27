import { useTheme } from '../browser/useTheme.ts';
import { defineInjection } from '../browser/defineInjection.ts';

/** The light or dark theme: the visitor's choice once made, else the system's (useTheme). */
export const createThemeStore = useTheme;

export type ThemeStore = ReturnType<typeof createThemeStore>;
export const [provideThemeStore, useThemeStore] = defineInjection<ThemeStore>('theme');
