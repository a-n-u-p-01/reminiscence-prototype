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
    <div className="space-y-6 min-h-[350px] animate-[fadeIn_0.12s_ease-out] max-w-xl mx-auto pb-12 text-theme-primary select-none">
      {/* Header Blocks */}
      <div className="border-b border-theme pb-5">
        <h1 className="text-base font-semibold tracking-tight text-theme-primary">
          {showDashboardMode ? 'Workspace Dashboard' : 'Knowledge Logging'}
        </h1>
        <p className="text-xs text-theme-muted font-sans tracking-wide mt-1">
          {showDashboardMode
            ? 'Knowledge baseline status update.'
            : 'Convert natural language daily logs into review anchors.'}
        </p>
      </div>

      {/* Core Dynamic Screen Modes */}
      {showDashboardMode ? (
        <div className="space-y-6">
          <div className="bg-theme-card border border-theme rounded-2xl p-6 text-center space-y-5 shadow-xl">
            <div className="mx-auto w-11 h-11 rounded-xl bg-theme border border-theme flex items-center justify-center text-theme-accent">
              <Flame size={20} className="animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-[15px] font-medium tracking-tight text-theme-primary">
                {pendingCount} Revisions Pending
              </h2>
              <p className="text-xs text-theme-secondary font-sans tracking-wide max-w-xs mx-auto leading-relaxed">
                Spaced repetition anchors require review to lock into your long-term developer memory.
              </p>
            </div>

            {/* Premium CTA High Contrast Focus */}
            <button
              onClick={onNavigateToReview}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm py-3 px-4 rounded-xl active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <BookOpen size={14} className="opacity-90" />
              <span>Start Revision</span>
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setStatusMessage(null);
                setForceShowInput(true);
              }}
              className="text-[11px] font-mono text-theme-muted hover:text-theme-accent transition-colors flex items-center justify-center gap-1.5 mx-auto tracking-wide"
            >
              <Plus size={13} />
              <span>Or log today's new study note anyway</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-[fadeIn_0.15s_ease-out]">
          
          <div className="space-y-4 pt-2">
            {/* 🔑 MODIFIED BLOCK: Old inline container stripped out for your explicit component call */}
            <StatusCapsule
              message={statusMessage}
              type={statusMessage?.type || 'success'}
            />

            <form onSubmit={handleSave} className="space-y-4">
              {/* 🔑 Added select-text to isolate input fields from global app select-none wrappers */}
              <div className="bg-theme-card border border-theme rounded-2xl p-5 focus-within:border-theme transition-colors relative select-text shadow-sm">
                <div className="flex justify-between items-center mb-3 select-none">
                  <label className="block text-[10px] font-mono tracking-wider text-theme-muted uppercase">
                    Input Workspace Note
                  </label>

                  {hasExistingEntry && !isEditing && !isInitialFetching && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-[10px] text-theme-secondary hover:text-theme-primary font-medium font-mono flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg bg-theme border border-theme active:scale-[0.97]"
                    >
                      <Edit2 size={10} />
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
                  
                  // 🔑 CORE FIXES: Explicit native inputs to trigger the Android Keyboard suggestions bar
                  inputMode="text"
                  autoComplete="on"
                  autoCorrect="on"
                  spellCheck={true}
                  
                  className="w-full bg-transparent text-[14px] text-theme-primary placeholder-zinc-600 resize-none focus:outline-none leading-relaxed tracking-wide disabled:opacity-50 select-text font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isInputDisabled || !hasUnsavedChanges}
                className="w-full bg-theme-card hover:bg-theme border border-theme text-theme-secondary hover:text-theme-primary font-medium text-xs py-3 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-theme-muted border-t-theme-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles size={14} className="opacity-70" />
                    <span>Save Note</span>
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
                className="w-full bg-transparent hover:bg-theme-card/40 border border-theme text-theme-muted hover:text-theme-secondary text-[11px] py-2.5 rounded-xl font-mono tracking-wide"
              >
                &larr; Return to pending review panel ({pendingCount})
              </button>
            )}
          </div>

          {/* Timeline Flow Container */}
          <div className="bg-theme-card border border-theme rounded-2xl p-5 space-y-5 shadow-inner">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <span className="text-[10px] font-mono tracking-wider uppercase text-theme-secondary flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-theme-accent animate-pulse" />
                Active Memory Engine
              </span>
              <span className="text-[10px] text-theme-muted font-mono tracking-wide">How it works</span>
            </div>

            <div className="relative pl-2 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-theme">
              
              {/* Step 1 */}
              <div className="relative flex items-start gap-4 group">
                <div className="absolute left-0 w-6 h-6 rounded-lg bg-theme border border-theme text-[10px] font-mono text-theme-secondary flex items-center justify-center font-medium shadow-sm z-10">
                  1
                </div>
                <div className="pl-9 space-y-0.5">
                  <h4 className="text-xs font-medium text-theme-primary flex items-center gap-1.5">
                    <Brain size={12} className="text-theme-muted" />
                    <span>Clear Clutter</span>
                  </h4>
                  <p className="text-[11px] font-sans text-theme-muted leading-relaxed tracking-wide">
                    Type freely. We clean up your raw thoughts instantly.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-start gap-4 group">
                <div className="absolute left-0 w-6 h-6 rounded-lg bg-theme border border-theme text-[10px] font-mono text-theme-secondary flex items-center justify-center font-medium shadow-sm z-10">
                  2
                </div>
                <div className="pl-9 space-y-0.5">
                  <h4 className="text-xs font-medium text-theme-primary flex items-center gap-1.5">
                    <Target size={12} className="text-theme-muted" />
                    <span>Smart Snippets</span>
                  </h4>
                  <p className="text-[11px] font-sans text-theme-muted leading-relaxed tracking-wide">
                    Our system finds and tags the most important ideas.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-start gap-4 group">
                <div className="absolute left-0 w-6 h-6 rounded-lg bg-theme border border-theme text-[10px] font-mono text-theme-secondary flex items-center justify-center font-medium shadow-sm z-10">
                  3
                </div>
                <div className="pl-9 space-y-0.5">
                  <h4 className="text-xs font-medium text-theme-primary flex items-center gap-1.5">
                    <CalendarDays size={12} className="text-theme-muted" />
                    <span>Timed Reviews</span>
                  </h4>
                  <p className="text-[11px] font-sans text-theme-muted leading-relaxed tracking-wide">
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