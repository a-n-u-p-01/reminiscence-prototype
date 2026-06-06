import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { dashboardService } from '../api/dashboardService';
import { useReviewEngine } from './ReviewContext';
import { useAuth } from './AuthContext'; // 🔑 Import Auth context to guard endpoints

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { isManualRefreshing } = useReviewEngine();
  const { isAuthenticated } = useAuth(); // 🔑 Extract authentication state to monitor access rights

  const [isPullToRefresh,setIsPullToRefresh] = useState(false);

  // Dynamic System Date Anchor
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [heatmapData, setHeatmapData] = useState({});
  const [metrics, setMetrics] = useState({
    currentStreak: 0,
    totalConceptsCount: 0,
    averageMasteryScore: 0,
    dueTomorrowCount: 0,
    dueNextWeekCount: 0
  });
  const [activeDayDetails, setActiveDayDetails] = useState({ dailyLog: null, revisionLogs: [] });
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Keep selected date aligned if systemic calendar day transitions
  useEffect(() => {
    setSelectedDate(todayStr);
  }, [todayStr]);

  // Core Data Fetcher: Heatmap Matrix & Numerical Aggregations
  const loadCoreDashboardData = async () => {
    if (!isAuthenticated) return; // 🛡️ Guard against execution without a valid credentials layout session
    try {
       setIsLoadingHeatmap(true);
      const [heatmapRes, metricsRes] = await Promise.all([
        dashboardService.getHeatmap(),
        dashboardService.getMetrics()
      ]);
      setHeatmapData(heatmapRes);
      setMetrics(metricsRes);
    } catch (error) {
      console.error("Failed to load dashboard metrics matrix maps", error);
    } finally {
      setIsLoadingHeatmap(false);
    }
  };

  // Activity Fetcher: Specific ledger details for active date selection
  const loadDateDetails = async (date) => {
    if (!isAuthenticated) return; // 🛡️ Guard against execution without a valid credentials layout session
    try {
      setIsLoadingActivity(true);
      const data = await dashboardService.getActivityDetails(date);
      setActiveDayDetails({
        dailyLog: data.dailyLogs && data.dailyLogs.length > 0 ? data.dailyLogs[0] : null,
        revisionLogs: data.revisionLogs || []
      });
    } catch (error) {
      console.error(`Failed to fetch production activity payload for timestamp: ${date}`, error);
      setActiveDayDetails({ dailyLog: null, revisionLogs: [] });
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // 1. Component Mounting & Day Change: tracks todayStr initialization with auth safety validation
  useEffect(() => {
    if (isAuthenticated) {
      loadCoreDashboardData();
    }
  }, [todayStr, isAuthenticated]); // 🔑 Re-run structural sync cleanly if session unlocks

  // 2. Active Date Selection Change: tracks view transitions on target coordinate modification with auth safety validation
  useEffect(() => {
    if (isAuthenticated) {
      loadDateDetails(selectedDate);
    }
  }, [selectedDate, isAuthenticated]); // 🔑 Re-run matrix details tracking if user context switches dynamically

  const resetDashboardState = () => {
    setSelectedDate(todayStr); // Reset to current day
    setHeatmapData({});
    setMetrics({
      currentStreak: 0,
      totalConceptsCount: 0,
      averageMasteryScore: 0,
      dueTomorrowCount: 0,
      dueNextWeekCount: 0
    });
    setActiveDayDetails({ dailyLog: null, revisionLogs: [] });
    setIsLoadingHeatmap(false);
    setIsLoadingActivity(false);
  };

  const value = {
    todayStr,
    selectedDate,
    setSelectedDate,
    heatmapData,
    metrics,
    activeDayDetails,
    isLoadingHeatmap,
    isLoadingActivity,
    // 3. Centralized Refresh: Explicitly executes both fetches together cleanly
    refreshDashboard: () => {
      setIsPullToRefresh(true);
      if (!isAuthenticated) return Promise.resolve([null, null]);
      return Promise.all([loadCoreDashboardData(), loadDateDetails(selectedDate)]);
    },
    resetDashboardState,
    isPullToRefresh,
    setIsPullToRefresh
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be utilized inside a DashboardProvider structure.');
  }
  return context;
}