import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';
interface ThemeCtx { theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void; }

const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', toggleTheme: () => {}, setTheme: () => {} });
const STORAGE_KEY = 'speak2design_theme';

const applyThemeClass = (t: Theme) => {
  const root = document.documentElement;
  root.classList.toggle('light', t === 'light');
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as Theme | null;
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  // Apply on mount + whenever it changes; persist.
  useEffect(() => {
    applyThemeClass(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState(p => (p === 'dark' ? 'light' : 'dark')), []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
