import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle,
  Flame,
  Plus,
  Sparkles,
  AlertCircle,
  Brain,
  Target,
  CalendarDays,
  Edit2
} from 'lucide-react';
import { noteService } from '../api/noteService';
import { dashboardService } from '../api/dashboardService';

export default function HomePage({ pendingCount, onNavigateToReview, onNoteLogged }) {
  const [noteText, setNoteText] = useState('');
  const [originalNoteText, setOriginalNoteText] = useState(''); // Tracks DB state to look for modifications
  const [loading, setLoading] = useState(false);
  const [isInitialFetching, setIsInitialFetching] = useState(true);
  const [hasExistingEntry, setHasExistingEntry] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [forceShowInput, setForceShowInput] = useState(false);

  // Dynamic System Date Anchor Context
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Fetch current day active log from the dashboard service seamlessly
  useEffect(() => {
    async function fetchTodayExistingLog() {
      try {
        setIsInitialFetching(true);
        const data = await dashboardService.getActivityDetails(todayStr);
        
        // Check if an input log was already saved for today
        if (data && data.dailyLogs && data.dailyLogs.length > 0) {
          const initialText = data.dailyLogs[0].rawInput || '';
          setNoteText(initialText);
          setOriginalNoteText(initialText); // Anchor original text reference
          setHasExistingEntry(true);
          setIsEditing(false); // Locked down until Edit is explicitly clicked
        } else {
          setOriginalNoteText('');
          setHasExistingEntry(false);
          setIsEditing(true); // Pure fresh entry ready for typing
        }
      } catch (err) {
        console.error("Failed to fetch current matrix coordinates payload data:", err);
        // Fallback for network issues: assume clean canvas
        setIsEditing(true);
      } finally {
        setIsInitialFetching(false);
      }
    }

    fetchTodayExistingLog();
  }, [todayStr]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!noteText.trim() || loading || noteText === originalNoteText) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      await noteService.saveDailyEntry(noteText);

      setStatusMessage({
        type: 'success',
        text: 'Note saved successfully.'
      });

      setOriginalNoteText(noteText); // Re-anchor text since it matches backend now
      setHasExistingEntry(true);
      setIsEditing(false);

      if (onNoteLogged) {
        onNoteLogged();
      }

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

  const showDashboardMode = pendingCount > 0 && !forceShowInput;
  const isInputDisabled = loading || isInitialFetching || !isEditing;
  
  // Validates text presence AND that it doesn't identically match what's already saved
  const hasUnsavedChanges = noteText.trim() !== '' && noteText !== originalNoteText;

  return (
    <div className="space-y-6 min-h-[350px] animate-[fadeIn_0.12s_ease-out] max-w-xl mx-auto pb-8">

      {/* Header Blocks */}
      <div className="border-b border-zinc-800/60 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">
          {showDashboardMode ? 'Workspace Dashboard' : 'Knowledge Logging'}
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          {showDashboardMode
            ? 'Knowledge baseline status update.'
            : 'Convert natural language daily logs into review anchors.'}
        </p>
      </div>

      {/* Core Dynamic Screen Modes */}
      {showDashboardMode ? (
        <div className="space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-blue-400">
              <Flame size={24} className="animate-pulse" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-zinc-100">
                {pendingCount} Revisions Pending
              </h2>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1 leading-relaxed">
                Spaced repetition anchors require review to lock into your long-term developer memory.
              </p>
            </div>

            <button
              onClick={onNavigateToReview}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm py-3 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <BookOpen size={16} />
              Start Revision
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setStatusMessage(null);
                setForceShowInput(true);
              }}
              className="text-xs text-zinc-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <Plus size={14} />
              Or log today's new study note anyway
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-[fadeIn_0.15s_ease-out]">

          {/* Timeline Flow */}
          <div className="bg-zinc-900/10 border border-zinc-800/60 rounded-2xl p-4 space-y-4 shadow-inner">
            <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2.5">
              <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Active Memory Engine
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">How it works</span>
            </div>

            <div className="relative pl-4 space-y-4 before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800">

              <div className="relative flex items-start gap-4 group">
                <div className="absolute left-[-1px] w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-[10px] font-mono text-purple-400 flex items-center justify-center font-bold shadow-md z-10">
                  1
                </div>
                <div className="pl-6 space-y-0.5">
                  <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Brain size={12} className="text-purple-400" />
                    Clear Clutter
                  </h4>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    Type freely. We clean up your raw thoughts instantly.
                  </p>
                </div>
              </div>

              <div className="relative flex items-start gap-4 group">
                <div className="absolute left-[-1px] w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-[10px] font-mono text-blue-400 flex items-center justify-center font-bold shadow-md z-10">
                  2
                </div>
                <div className="pl-6 space-y-0.5">
                  <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Target size={12} className="text-blue-400" />
                    Smart Snippets
                  </h4>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    Our system finds and tags the most important ideas.
                  </p>
                </div>
              </div>

              <div className="relative flex items-start gap-4 group">
                <div className="absolute left-[-1px] w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-[10px] font-mono text-emerald-400 flex items-center justify-center font-bold shadow-md z-10">
                  3
                </div>
                <div className="pl-6 space-y-0.5">
                  <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <CalendarDays size={12} className="text-emerald-400" />
                    Timed Reviews
                  </h4>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    We prompt you to review things right before you forget.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Form */}
          <div className="space-y-4 pt-4 border-t border-zinc-900/60">

            {statusMessage && (
              <div className="fixed top-4 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 pointer-events-none">
                <div
                  className={`w-full sm:w-auto max-w-md mx-auto px-4 py-3 rounded-2xl text-sm flex items-center gap-3 border shadow-2xl backdrop-blur-md
                  animate-[toastSlide_2.6s_ease-in-out_forwards]
                  ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/15 border-red-500/30 text-red-400'
                  }`}
                >
                  <div className="shrink-0">
                    {statusMessage.type === 'success' ? (
                      <CheckCircle size={18} />
                    ) : (
                      <AlertCircle size={18} />
                    )}
                  </div>

                  <span className="leading-relaxed font-medium">
                    {statusMessage.text}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 focus-within:border-blue-500/50 transition-colors relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
                    Input Workspace Note
                  </label>
                  
                  {/* Inline Action Trigger: Shows up when data is loaded and locked down */}
                  {hasExistingEntry && !isEditing && !isInitialFetching && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium font-mono flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-blue-500/5 border border-blue-500/10 active:scale-[0.97]"
                    >
                      <Edit2 size={11} />
                    </button>
                  )}
                </div>

                <textarea
                  required
                  rows={5}
                  value={noteText}
                  disabled={isInputDisabled}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={isInitialFetching ? "Syncing baseline..." : "Type anything you learned, read, or want to remember today..."}
                  className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none leading-relaxed disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isInputDisabled || !hasUnsavedChanges}
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium text-sm py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles size={15} />
                    Save Note
                  </>
                )}
              </button>
            </form>

            {pendingCount > 0 && (
              <button
                onClick={() => {
                  setForceShowInput(false);
                  setStatusMessage(null);
                }}
                className="w-full border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs py-2 rounded-xl transition-colors font-medium"
              >
                ← Return to pending review panel ({pendingCount})
              </button>
            )}

          </div>

        </div>
      )}
    </div>
  );
}