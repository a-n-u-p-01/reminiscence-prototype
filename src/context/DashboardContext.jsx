import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { dashboardService } from '../api/dashboardService';
import { useReviewEngine } from './ReviewContext';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { isManualRefreshing } = useReviewEngine();

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

  // 1. Component Mounting & Day Change: Only tracks todayStr initialization
  useEffect(() => {
    loadCoreDashboardData();
  }, [todayStr]);

  // 2. Active Date Selection Change: Only tracks view transitions on target coordinate modification
  useEffect(() => {
    loadDateDetails(selectedDate);
  }, [selectedDate]);

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
    refreshDashboard: () => Promise.all([loadCoreDashboardData(), loadDateDetails(selectedDate)])
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