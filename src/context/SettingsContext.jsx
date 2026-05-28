// src/context/SettingsContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getItem, setItem } from '../storage/storageService';

// Default fallback values
const DEFAULTS = {
  theme: 'zinc', // matches your CSS theme class names
  textScale: 'base', // 'sm' | 'base' | 'lg' | 'xl'
};

// Context shape
export const SettingsContext = createContext({
  theme: DEFAULTS.theme,
  setTheme: (t) => {},
  textScale: DEFAULTS.textScale,
  setTextScale: (s) => {},
});

// Provider component – wrap the whole app once (e.g., in src/main.jsx)
export const SettingsProvider = ({ children }) => {
  const [theme, setThemeState] = useState(DEFAULTS.theme);
  const [textScale, setTextScaleState] = useState(DEFAULTS.textScale);

  // Load persisted values on mount
  useEffect(() => {
    (async () => {
      const savedTheme = await getItem('appTheme');
      const savedScale = await getItem('appTextScale');
      if (savedTheme) setThemeState(savedTheme);
      if (savedScale) setTextScaleState(savedScale);
    })();
  }, []);

  // Apply side‑effects whenever a value changes
  useEffect(() => {
    // Theme class on <html>
    document.documentElement.className = `theme-${theme}`;
    // Text‑scale CSS variable (mapping to pixel size)
    const scaleMap = { sm: '14px', base: '16px', lg: '18px', xl: '20px' };
    document.documentElement.style.setProperty('--app-font-size', scaleMap[textScale] || '16px');
  }, [theme, textScale]);

  // Persist helpers
  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    await setItem('appTheme', newTheme);
  };
  const setTextScale = async (newScale) => {
    setTextScaleState(newScale);
    await setItem('appTextScale', newScale);
  };

  return (
    <SettingsContext.Provider value={{ theme, setTheme, textScale, setTextScale }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Convenience hook
export const useSettings = () => useContext(SettingsContext);
