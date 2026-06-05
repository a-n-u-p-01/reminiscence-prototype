import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { dashboardService } from '../api/dashboardService';
import { noteService } from '../api/noteService';
import { useAuth } from './AuthContext'; // 🔑 Import Auth context to guard endpoints

const HomeContext = createContext(null);

export function HomeProvider({ children }) {
  const { isAuthenticated } = useAuth(); // 🔑 Extract authentication state to monitor access rights
  const [noteText, setNoteText] = useState('');
  const [originalNoteText, setOriginalNoteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitialFetching, setIsInitialFetching] = useState(true);
  const [hasExistingEntry, setHasExistingEntry] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [forceShowInput, setForceShowInput] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const fetchTodayExistingLog = async () => {
    if (!isAuthenticated) return; // 🛡️ Guard against execution without a valid credentials layout session
    try {
      setIsInitialFetching(true);
      const data = await dashboardService.getActivityDetails(todayStr);

      if (data && data.dailyLogs && data.dailyLogs.length > 0) {
        const log = data.dailyLogs[0];
        
        // Reconstruct the hyphenated list from topics array or fallback to rawInput
        let initialText = '';
        if (log.topics && Array.isArray(log.topics) && log.topics.length > 0) {
          initialText = log.topics.map(t => `- ${t}`).join('\n');
        } else {
          initialText = log.rawInput || '';
        }

        setNoteText(initialText);
        setOriginalNoteText(initialText);
        setHasExistingEntry(true);
        setIsEditing(false);
      } else {
        setOriginalNoteText('');
        setHasExistingEntry(false);
        setIsEditing(true);
      }
    } catch (err) {
      console.error("Failed to fetch current matrix coordinates payload data:", err);
      setIsEditing(true);
    } finally {
      setIsInitialFetching(false);
    }
  };

  // Component Mounting & Day Change: tracks todayStr initialization with auth safety validation
  useEffect(() => {
    if (isAuthenticated) {
      fetchTodayExistingLog();
    }
  }, [todayStr, isAuthenticated]); // 🔑 Re-run structural sync cleanly if session unlocks

  const handleSaveNote = async (requestBody) => {
    if (loading || !noteText.trim() || noteText === originalNoteText) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      // Pass the structured { topics: [] } body to the service
      await noteService.saveDailyEntry(requestBody);

      setStatusMessage({
        type: 'success',
        text: 'Note saved successfully.'
      });

      setOriginalNoteText(noteText);
      setHasExistingEntry(true);
      setIsEditing(false);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to save note. Please try again.'
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        setStatusMessage(null);
      }, 2500);
    }
  };

  const resetHomeState = () => {
    setNoteText('');
    setOriginalNoteText('');
    setLoading(false); // 🔑 Fixed: Changed from loading(false) to setLoading(false)
    setIsInitialFetching(true);
    setHasExistingEntry(false);
    setIsEditing(false);
    setStatusMessage(null);
    setForceShowInput(false);
  };

  const hasUnsavedChanges = noteText.trim() !== '' && noteText !== originalNoteText;

  return (
    <HomeContext.Provider value={{
      noteText,
      setNoteText,
      loading,
      isInitialFetching,
      hasExistingEntry,
      isEditing,
      setIsEditing,
      statusMessage,
      setStatusMessage,
      forceShowInput,
      setForceShowInput,
      hasUnsavedChanges,
      refreshHomeNote: fetchTodayExistingLog,
      handleSaveNote,
      resetHomeState
    }}>
      {children}
    </HomeContext.Provider>
  );
}

export function useHomeEngine() {
  const context = useContext(HomeContext);
  if (!context) {
    throw new Error('useHomeEngine must be used within a HomeProvider');
  }
  return context;
}