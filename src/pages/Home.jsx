import React from 'react';
import { BookOpen, CheckCircle, Flame, Plus, Sparkles, AlertCircle, Brain, Target, CalendarDays, Edit2 } from 'lucide-react';
import { useHomeEngine } from '../context/HomeContext';
import StatusCapsule from '../components/StatusCapsule'; // 🔑 Added import for your standalone capsule

export default function HomePage({ pendingCount, onNavigateToReview, mainContentRef }) {
  const {
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
    handleSaveNote
  } = useHomeEngine();

  const handleSave = (e) => {
    e.preventDefault();
    handleSaveNote(noteText);
  };

  const showDashboardMode = pendingCount > 0 && !forceShowInput;
  const isInputDisabled = loading || isInitialFetching || !isEditing;

  return (
    <div className="space-y-6 min-h-[350px] animate-[fadeIn_0.12s_ease-out] max-w-xl mx-auto pb-8 text-theme-primary">
      {/* Header Blocks */}
      <div className="border-b border-theme pb-4">
        <h1 className="text-xl font-bold tracking-tight text-theme-primary">
          {showDashboardMode ? 'Workspace Dashboard' : 'Knowledge Logging'}
        </h1>
        <p className="text-xs text-theme-muted mt-0.5">
          {showDashboardMode
            ? 'Knowledge baseline status update.'
            : 'Convert natural language daily logs into review anchors.'}
        </p>
      </div>

      {/* Core Dynamic Screen Modes */}
      {showDashboardMode ? (
        <div className="space-y-6">
          <div className="bg-theme-card border border-theme rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-blue-400">
              <Flame size={24} className="animate-pulse" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-theme-primary">
                {pendingCount} Revisions Pending
              </h2>
              <p className="text-xs text-theme-muted max-w-xs mx-auto mt-1 leading-relaxed">
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
              className="text-xs text-theme-muted hover:text-blue-400 transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <Plus size={14} />
              Or log today's new study note anyway
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-[fadeIn_0.15s_ease-out]">
       

          <div className="space-y-4 pt-4 border-t border-zinc-900/60">
            {/* 🔑 MODIFIED BLOCK: Old inline container stripped out for your explicit component call */}
            <StatusCapsule
              message={statusMessage}
              type={statusMessage?.type || 'success'}
            />

            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-theme-card border border-theme rounded-2xl p-4 focus-within:border-blue-500/50 transition-colors relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-mono tracking-wider text-theme-muted uppercase">
                    Input Workspace Note
                  </label>

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
                  className="w-full bg-transparent text-sm text-theme-primary placeholder-zinc-600 resize-none focus:outline-none leading-relaxed disabled:opacity-50"
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
                className="w-full border border-theme hover:bg-theme-card text-theme-secondary text-xs py-2 rounded-xl transition-colors font-medium"
              >
                &larr; Return to pending review panel ({pendingCount})
              </button>
            )}
          </div>
             {/* Timeline Flow */}
          <div className="bg-zinc-900/10 border border-theme rounded-2xl p-4 space-y-4 shadow-inner">
            <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2.5">
              <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                Active Memory Engine
              </span>
              <span className="text-[10px] text-theme-muted font-mono">How it works</span>
            </div>

            <div className="relative pl-4 space-y-4 before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[var(--color-dark-border)]">
              <div className="relative flex items-start gap-4 group">
                <div className="absolute left-[-1px] w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-[10px] font-mono text-purple-400 flex items-center justify-center font-bold shadow-md z-10">1</div>
                <div className="pl-6 space-y-0.5">
                  <h4 className="text-xs font-semibold text-theme-primary flex items-center gap-1.5">
                    <Brain size={12} className="text-purple-400" />
                    Clear Clutter
                  </h4>
                  <p className="text-[11px] text-theme-muted leading-normal">
                    Type freely. We clean up your raw thoughts instantly.
                  </p>
                </div>
              </div>

              <div className="relative flex items-start gap-4 group">
                <div className="absolute left-[-1px] w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-[10px] font-mono text-blue-400 flex items-center justify-center font-bold shadow-md z-10">2</div>
                <div className="pl-6 space-y-0.5">
                  <h4 className="text-xs font-semibold text-theme-primary flex items-center gap-1.5">
                    <Target size={12} className="text-blue-400" />
                    Smart Snippets
                  </h4>
                  <p className="text-[11px] text-theme-muted leading-normal">
                    Our system finds and tags the most important ideas.
                  </p>
                </div>
              </div>

              <div className="relative flex items-start gap-4 group">
                <div className="absolute left-[-1px] w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-[10px] font-mono text-emerald-400 flex items-center justify-center font-bold shadow-md z-10">3</div>
                <div className="pl-6 space-y-0.5">
                  <h4 className="text-xs font-semibold text-theme-primary flex items-center gap-1.5">
                    <CalendarDays size={12} className="text-emerald-400" />
                    Timed Reviews
                  </h4>
                  <p className="text-[11px] text-theme-muted leading-normal">
                    We prompt you to review things right before you forget.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}