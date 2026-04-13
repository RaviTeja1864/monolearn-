import { useState, useEffect } from 'react';

const THEME_KEY = 'solo-tutor-theme';
const LEGACY_THEME_KEY = 'studyos-theme';

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY) || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
};
