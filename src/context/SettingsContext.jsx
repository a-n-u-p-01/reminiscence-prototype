import React, { createContext, useContext, useEffect, useState } from 'react';
import { getItem, setItem } from '../storage/storageService';

const DEFAULTS = {
  theme: 'zinc',
  textScale: 'base',
  reviewCap: 999,
  algoEngine: 'fsrs',
  defaultSide: 'front',
  autoRevealTimer: 0,
};

export const SettingsContext = createContext({});

export const SettingsProvider = ({ children }) => {
  // Synchronous initialization to prevent "blink"
  const [theme, setThemeState] = useState(() => localStorage.getItem('appTheme') || DEFAULTS.theme);
  const [textScale, setTextScaleState] = useState(() => localStorage.getItem('appTextScale') || DEFAULTS.textScale);
  const [reviewCap, setReviewCapState] = useState(() => Number(localStorage.getItem('reviewCap') || DEFAULTS.reviewCap));
  const [algoEngine, setAlgoEngineState] = useState(() => localStorage.getItem('algoEngine') || DEFAULTS.algoEngine);
  const [defaultSide, setDefaultSideState] = useState(() => localStorage.getItem('defaultSide') || DEFAULTS.defaultSide);
  const [autoRevealTimer, setAutoRevealTimerState] = useState(() => Number(localStorage.getItem('autoRevealTimer') || DEFAULTS.autoRevealTimer));

  useEffect(() => {
    (async () => {
      // Optional: keep this if you need to fetch updates from external storage 
      // or verify consistency, but the UI is already hydrated by the synchronous init above.
      const savedTheme = await getItem('appTheme');
      const savedScale = await getItem('appTextScale');
      const savedCap = await getItem('reviewCap');
      const savedEngine = await getItem('algoEngine');
      const savedSide = await getItem('defaultSide');
      const savedTimer = await getItem('autoRevealTimer');

      if (savedTheme) setThemeState(savedTheme);
      if (savedScale) setTextScaleState(savedScale);
      if (savedCap) setReviewCapState(Number(savedCap));
      if (savedEngine) setAlgoEngineState(savedEngine);
      if (savedSide) setDefaultSideState(savedSide);
      if (savedTimer) setAutoRevealTimerState(Number(savedTimer));
    })();
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    // 1. Handle Theme (Class swapping)
    const themes = ['theme-zinc', 'theme-slate', 'theme-ocean', 'theme-matte', 'theme-frost', 'theme-sand'];
    root.classList.remove(...themes);
    
    // Add the active theme
    root.classList.add(`theme-${theme}`);

    // 2. Handle Text Scale (CSS Variable injection)
    const scaleMap = {
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px'
    };
    root.style.setProperty('--app-font-size', scaleMap[textScale] || '16px');

  }, [theme, textScale]);

  const resetSettings = async () => {
    setReviewCapState(DEFAULTS.reviewCap);
    setAlgoEngineState(DEFAULTS.algoEngine);
    setDefaultSideState(DEFAULTS.defaultSide);
    setAutoRevealTimerState(DEFAULTS.autoRevealTimer);

    const keys = ['reviewCap', 'algoEngine', 'defaultSide', 'autoRevealTimer', 'appTheme', 'appTextScale'];
    for (const key of keys) {
      await setItem(key, ''); 
    }
  };

 const value = {
  theme,
  setThemeTransient: (v) => setThemeState(v), 
  setTheme: async (v) => { setThemeState(v); await setItem('appTheme', v); },

  textScale,
  setTextScaleTransient: (v) => setTextScaleState(v),
  setTextScale: async (v) => { setTextScaleState(v); await setItem('appTextScale', v); },

  reviewCap,
  setReviewCapTransient: (v) => setReviewCapState(Number(v)),
  setReviewCap: async (v) => { setReviewCapState(Number(v)); await setItem('reviewCap', String(v)); },

  algoEngine,
  setAlgoEngineTransient: (v) => setAlgoEngineState(v),
  setAlgoEngine: async (v) => { setAlgoEngineState(v); await setItem('algoEngine', v); },

  defaultSide,
  setDefaultSideTransient: (v) => setDefaultSideState(v),
  setDefaultSide: async (v) => { setDefaultSideState(v); await setItem('defaultSide', v); },

  autoRevealTimer,
  setAutoRevealTimerTransient: (v) => setAutoRevealTimerState(Number(v)),
  setAutoRevealTimer: async (v) => { setAutoRevealTimerState(Number(v)); await setItem('autoRevealTimer', String(v)); },
  
  resetSettings
};

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);