/**
 * KenZen Sudoku — Theme Context Provider
 * 
 * Wraps the entire app. Respects system color scheme by default,
 * with user override stored in encrypted local DB.
 */

import React, {createContext, useContext, useState, useCallback, useMemo, useEffect} from 'react';
import {useColorScheme, StatusBar} from 'react-native';
import {LIGHT_THEME, DARK_THEME} from './tokens';
import type {Theme, ThemeMode} from '../types';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: LIGHT_THEME,
  themeMode: 'system',
  setThemeMode: () => {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'system',
}) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialMode);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const theme = useMemo(() => (isDark ? DARK_THEME : LIGHT_THEME), [isDark]);

  const contextValue = useMemo(
    () => ({
      theme,
      themeMode,
      setThemeMode,
      isDark,
    }),
    [theme, themeMode, isDark],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.paper}
      />
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
