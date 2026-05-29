// src/hooks/useAppReset.js
import { useSettings } from '../context/SettingsContext';
import { useReviewEngine } from '../context/ReviewContext';
import { useHomeEngine } from '../context/HomeContext';
import { useDashboard } from '../context/DashboardContext';

export const useAppReset = () => {
  const { resetSettings } = useSettings();
  const { resetReviewState } = useReviewEngine();
  const { resetHomeState } = useHomeEngine();
  const { resetDashboardState } = useDashboard();

  return async () => {
    await resetSettings();
    resetReviewState();
    resetHomeState();
    resetDashboardState();
  };
};