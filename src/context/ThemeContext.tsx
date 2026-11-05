import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'neon-city' | 'light';

interface ThemeContextType {
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'neon-city',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('parkpulse_theme');
      if (saved === 'light' || saved === 'neon-city') {
        return saved as AppTheme;
      }
    } catch (e) {
      // ignore
    }
    return 'neon-city';
  });

  useEffect(() => {
    try {
      localStorage.setItem('parkpulse_theme', theme);
    } catch (e) {
      // ignore
    }

    if (theme === 'light') {
      document.body.classList.add('theme-light');
      document.documentElement.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
      document.documentElement.classList.remove('theme-light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'neon-city' ? 'light' : 'neon-city'));
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
