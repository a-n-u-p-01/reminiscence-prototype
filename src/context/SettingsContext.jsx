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

   // Define the system: s1 is smallest, s5 is largest
const scaleMap = {
  xs: { s1: '10px', s2: '12px', s3: '14px', s4: '16px', s5: '20px', s6: '24px',s7: '20px' },
  sm: { s1: '9px', s2: '11px', s3: '13px', s4: '15px', s5: '17px', s6: '19px',s7: '21px' },
  base: { s1: '10px', s2: '12px', s3: '14px', s4: '16px', s5: '18px', s6: '20px',s7: '22px' },
  lg: { s1: '11px', s2: '13px', s3: '15px', s4: '17px', s5: '19px', s6: '21px',s7: '23px' },
  xl: { s1: '12px', s2: '14px', s3: '16px', s4: '18px', s5: '20px', s6: '22px',s7: '24px' },
};

// Retrieve the active configuration (defaulting to 'base')
const activeScales = scaleMap[textScale] || scaleMap['base'];

// Iterate through the keys (s1-s5) and inject them as CSS variables
Object.entries(activeScales).forEach(([key, value]) => {
  root.style.setProperty(`--${key}`, value);
});

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