// src/hooks/useAppReset.js
import { useSettings } from '../context/SettingsContext';
import { useReviewEngine } from '../context/ReviewContext';
import { useHomeEngine } from '../context/HomeContext';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext'; 

export const useAppReset = () => {
  const { resetReviewState } = useReviewEngine();
  const { resetHomeState } = useHomeEngine();
  const { resetDashboardState } = useDashboard();
  const {cleanAuthContext} = useAuth();
  

  return async () => {
    cleanAuthContext();
    await resetSettings();
    resetReviewState();
    resetHomeState();
    resetDashboardState();
  };
};