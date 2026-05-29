import React, { createContext, useContext, useState, useEffect } from 'react';
import { noteService } from '../api/noteService';
import { useAuth } from './AuthContext';

const ReviewContext = createContext(null);

export function ReviewProvider({ children }) {
  const { isAuthenticated } = useAuth();
  
  // App-wide sync states
  const [globalCount, setGlobalCount] = useState(0);
  const [isCountLoaded, setIsCountLoaded] = useState(false);
  const [reviewConcepts, setReviewConcepts] = useState([]);
  const [isConceptsLoading, setIsConceptsLoading] = useState(false);
  const [hasFetchedRevision, setHasFetchedRevision] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Core background network synchronization logic
  const handleSyncData = async (options = {}) => {
    const isSilent = options?.silent === true;
    if (!isSilent) setIsManualRefreshing(true);

    try {
      // 1. Fetch the updated total count
      const count = await noteService.getPendingCount();
      setGlobalCount(count);
      
      // 2. Fetch the fresh active review queue right away
      setTimeout(() => setIsConceptsLoading(true), 400);
      const data = await noteService.getPendingConcepts();
      setReviewConcepts(data || []);
      setHasFetchedRevision(true);
      
    } catch (err) {
      console.error("Engine synchronization failure:", err);
    } finally {
      if (!isSilent) {
        setTimeout(() => setIsManualRefreshing(false), 400);
        setTimeout(() => setIsConceptsLoading(false), 800);
      }
    }
  };

  // Lazy initialization of active items queue
  const lazyLoadRevisionQueue = async () => {
    if (hasFetchedRevision || isConceptsLoading) return;
    
    setIsConceptsLoading(true);
    try {
      const data = await noteService.getPendingConcepts();
      setReviewConcepts(data || []);
    } catch (err) {
      console.error("Failed to load layout concepts:", err);
    } finally {
      setIsConceptsLoading(false);
      setHasFetchedRevision(true);
    }
  };

  // Pop item out of review pool and step down counters
  const handleCardReviewed = (userConceptId) => {
    setReviewConcepts((prev) => prev.filter((card) => card.userConceptId !== userConceptId));
    setGlobalCount((prev) => Math.max(0, prev - 1));
  };

  // Initial deep load payload
  useEffect(() => {
    if (!isAuthenticated) return;

    const initializeDataSystem = async () => {
      try {
        const count = await noteService.getPendingCount();
        setGlobalCount(count);
      } catch (err) {
        console.warn("Bootstrap sync bypassed:", err);
      } finally {
        setIsCountLoaded(true);
      }
    };

    initializeDataSystem();
  }, [isAuthenticated]);

  // 🌟 FIX: Function definition moved up here so it's initialized before usage!
  const resetReviewState = () => {
    setGlobalCount(0);
    setIsCountLoaded(false);
    setReviewConcepts([]);
    setIsConceptsLoading(false);
    setHasFetchedRevision(false);
    setIsManualRefreshing(false);
  };

  const value = {
    globalCount,
    isCountLoaded,
    reviewConcepts,
    isConceptsLoading,
    isManualRefreshing,
    handleSyncData,
    lazyLoadRevisionQueue,
    handleCardReviewed,
    resetReviewState // Now safely accessible!
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviewEngine() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReviewEngine must be utilized inside a ReviewProvider structure.");
  }
  return context;
}