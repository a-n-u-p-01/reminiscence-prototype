import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { dashboardService } from '../api/dashboardService';
import { noteService } from '../api/noteService';

const HomeContext = createContext(null);

export function HomeProvider({ children }) {
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
    try {
      setIsInitialFetching(true);
      const data = await dashboardService.getActivityDetails(todayStr);

      if (data && data.dailyLogs && data.dailyLogs.length > 0) {
        const initialText = data.dailyLogs[0].rawInput || '';
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

  useEffect(() => {
    fetchTodayExistingLog();
  }, [todayStr]);

  const handleSaveNote = async (textToSave) => {
    if (!textToSave.trim() || loading || textToSave === originalNoteText) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      await noteService.saveDailyEntry(textToSave);

      setStatusMessage({
        type: 'success',
        text: 'Note saved successfully.'
      });

      setOriginalNoteText(textToSave);
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
      handleSaveNote
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