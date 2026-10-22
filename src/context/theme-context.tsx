import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Appearance, StyleSheet } from 'react-native';

import { DarkColors, LightColors, type Palette } from '@/constants/app-colors';

export type ThemeMode = 'dark' | 'light';

/**
 * The phone's own appearance when the app started — what the native splash was drawn with (it can't
 * see the in-app theme). Read at module load, before ThemeProvider overrides Appearance.
 */
export const LAUNCH_SYSTEM_MODE: ThemeMode = Appearance.getColorScheme() === 'light' ? 'light' : 'dark';

// Same key the Settings "Dark Mode" switch used before themes existed ('true' / 'false').
const DARK_MODE_KEY = 'elmonx_pref_dark_mode';

/** Saved choice, read synchronously so the first frame already has the right colors. Defaults to dark (website default). */
function readSavedMode(): ThemeMode {
  try {
    return SecureStore.getItem(DARK_MODE_KEY) === 'false' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: Palette;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  isDark: true,
  colors: DarkColors,
  setMode: () => {},
  toggleMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = readSavedMode();
    // Native pieces (alerts, keyboard, pickers, action sheets) follow the app's theme, not the phone's.
    Appearance.setColorScheme(saved);
    return saved;
  });

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    Appearance.setColorScheme(next);
    SecureStore.setItemAsync(DARK_MODE_KEY, String(next === 'dark')).catch(() => {});
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === 'dark',
      colors: mode === 'dark' ? DarkColors : LightColors,
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** The active palette. Re-renders the component when the theme changes. */
export function useAppColors(): Palette {
  return useContext(ThemeContext).colors;
}

/**
 * Themed replacement for a module-level `StyleSheet.create`: pass a factory that receives the
 * palette and call the returned hook inside the component. Each palette's sheet is built once.
 *
 *   const useStyles = makeStyles((AppColors) => ({ title: { color: AppColors.textPrimary } }));
 *   function Screen() { const styles = useStyles(); ... }
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: Palette) => T) {
  const cache = new Map<Palette, T>();
  return function useStyles(): T {
    const colors = useAppColors();
    let sheet = cache.get(colors);
    if (!sheet) {
      sheet = StyleSheet.create(factory(colors));
      cache.set(colors, sheet);
    }
    return sheet;
  };
}
