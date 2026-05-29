import React, { createContext, useContext, useEffect, useState } from 'react';
import { getItem, setItem } from '../storage/storageService';

const DEFAULTS = {
  theme: 'zinc',
  textScale: 'base',
  reviewCap: 25,
  algoEngine: 'fsrs',
  defaultSide: 'front',
  autoRevealTimer: 0,
};

export const SettingsContext = createContext({});

export const SettingsProvider = ({ children }) => {
  const [theme, setThemeState] = useState(DEFAULTS.theme);
  const [textScale, setTextScaleState] = useState(DEFAULTS.textScale);
  const [reviewCap, setReviewCapState] = useState(DEFAULTS.reviewCap);
  const [algoEngine, setAlgoEngineState] = useState(DEFAULTS.algoEngine);
  const [defaultSide, setDefaultSideState] = useState(DEFAULTS.defaultSide);
  const [autoRevealTimer, setAutoRevealTimerState] = useState(DEFAULTS.autoRevealTimer);

  useEffect(() => {
    (async () => {
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

  const resetSettings = async () => {
    setReviewCapState(DEFAULTS.reviewCap);
    setAlgoEngineState(DEFAULTS.algoEngine);
    setDefaultSideState(DEFAULTS.defaultSide);
    setAutoRevealTimerState(DEFAULTS.autoRevealTimer);

    // Use a clean removal system rather than setting keys to string "null"
    const keys = ['reviewCap', 'algoEngine', 'defaultSide', 'autoRevealTimer', 'appTheme', 'appTextScale'];
    for (const key of keys) {
      await setItem(key, ''); 
    }
  };

  const value = {
    theme,
    setTheme: async (v) => { setThemeState(v); await setItem('appTheme', v); },
    textScale,
    setTextScale: async (v) => { setTextScaleState(v); await setItem('appTextScale', v); },
    reviewCap,
    setReviewCap: async (v) => { setReviewCapState(Number(v)); await setItem('reviewCap', String(v)); },
    algoEngine,
    setAlgoEngine: async (v) => { setAlgoEngineState(v); await setItem('algoEngine', v); },
    defaultSide,
    setDefaultSide: async (v) => { setDefaultSideState(v); await setItem('defaultSide', v); },
    autoRevealTimer,
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