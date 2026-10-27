import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, AppTheme } from '../constants/theme';

const THEME_STORAGE_KEY = 'study_planner_theme_mode';

interface ThemeState {
  themeMode: 'system' | 'light' | 'dark';
  setThemeMode: (mode: 'system' | 'light' | 'dark') => Promise<void>;
  initTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: 'system',

  initTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        set({ themeMode: saved });
      }
    } catch {
      // Use system default
    }
  },

  setThemeMode: async (mode) => {
    set({ themeMode: mode });
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignore
    }
  },
}));

// --- SELECTORS ---
export const selectThemeMode = (state: ThemeState) => state.themeMode;

export function useActiveTheme(): { theme: AppTheme; isDark: boolean; themeMode: 'system' | 'light' | 'dark' } {
  const themeMode = useThemeStore(selectThemeMode);
  const systemScheme = Appearance.getColorScheme();

  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  return { theme, isDark, themeMode };
}
