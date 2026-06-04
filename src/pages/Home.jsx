import React from 'react';
import { BookOpen, Flame, Plus, Sparkles, Brain, Target, CalendarDays, Edit2 } from 'lucide-react';
import { useHomeEngine } from '../context/HomeContext';
import StatusCapsule from '../components/StatusCapsule';

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
    <div className="space-y-6 min-h-[350px] max-w-xl mx-auto pb-12 text-theme-primary select-none transition-all duration-300 ease-in-out">

      {/* 🔮 Ultra-Minimal Loading Accent Tint Keyframes */}
      <style>{`
        @keyframes mini-accent-pulse {
          0%, 100% { background-color: var(--bg-theme-card, #1c1c1e); opacity: 0.95; }
          50% { background-color: var(--bg-theme, #2c2c2e); opacity: 1; }
        }
        .ai-loading-btn {
          animation: mini-accent-pulse 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Header Blocks */}
      <div className="border-b border-theme pb-5 transition-all duration-300">
        <h1 className="text-s6 font-semibold tracking-tight text-theme-primary transition-opacity duration-200">
          {showDashboardMode ? 'Workspace Dashboard' : 'Knowledge Logging'}
        </h1>
        <p className="text-s2 text-theme-muted font-sans tracking-wide mt-1 transition-opacity duration-200">
          {showDashboardMode
            ? 'Knowledge baseline status update.'
            : 'Convert natural language daily logs into review anchors.'}
        </p>
      </div>


      {/* Core Dynamic Screen Modes Layout Container */}
      <div className="relative transition-all duration-300 ease-in-out grid grid-cols-1">

        {/* Branch A: Dashboard View */}
        <div
          className={`col-start-1 row-start-1 space-y-6 transition-all duration-300 transform origin-top ${showDashboardMode
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-[0.98] pointer-events-none absolute w-full'
            }`}
        >
          <div className="bg-theme-card border border-theme rounded-2xl p-6 text-center space-y-5 shadow-sm">
            <div className="mx-auto w-11 h-11 rounded-xl bg-theme border border-theme flex items-center justify-center text-theme-accent">
              <Flame size={18} className="animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-s6 font-medium tracking-tight text-theme-primary">
                {pendingCount} Revisions Pending
              </h2>
              <p className="text-s2 text-theme-muted font-sans tracking-wide max-w-xs mx-auto leading-relaxed">
                Review your knowledge anchors today to lock them into long-term memory.
              </p>
            </div>

            <button
              onClick={onNavigateToReview}
              className="w-full bg-theme-accent hover:opacity-90 text-theme-card font-medium text-s2 py-3 px-4 rounded-xl active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
            >
              <BookOpen size={13} className="opacity-90" />
              <span>Start Revision</span>
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setStatusMessage(null);
                setForceShowInput(true);
              }}
              className="text-s2 font-mono text-theme-muted hover:text-theme-accent transition-colors flex items-center justify-center gap-1.5 mx-auto tracking-wide py-1 px-3 rounded-lg hover:bg-theme-card/30"
            >
              <Plus size={12} />
              <span>Log today's new note anyway</span>
            </button>
          </div>
        </div>

        {/* Branch B: Input Note View */}
        <div
          className={`col-start-1 row-start-1 space-y-6 transition-all duration-300 transform origin-top ${!showDashboardMode
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-[0.98] pointer-events-none absolute w-full'
            }`}
        >
          <div className="space-y-4">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-theme-card border border-theme rounded-2xl p-5 focus-within:border-theme transition-colors relative select-text shadow-sm">
                <div className="flex justify-between items-center mb-3 select-none">
                  <label className="block text-s1 font-mono tracking-wider text-theme-muted uppercase">
                    Input Workspace Note
                  </label>

                  {hasExistingEntry && !isEditing && !isInitialFetching && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-s1 text-theme-secondary hover:text-theme-primary font-medium font-mono flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg bg-theme border border-theme active:scale-[0.97]"
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
                  placeholder={isInitialFetching ? "Syncing baseline..." : "Type what you learned today. It only takes a minute, and consistency is key....."}
                  inputMode="text"
                  autoComplete="on"
                  autoCorrect="on"
                  spellCheck={true}
                  className="w-full bg-transparent text-s3 text-theme-primary placeholder-theme-muted/50 resize-none focus:outline-none leading-relaxed tracking-wide disabled:opacity-50 select-text font-sans"
                />
              </div>

              {/* 🎯 Minimal Button Layer with Static Text */}
              <button
                type="submit"
                disabled={isInputDisabled || !hasUnsavedChanges}
                className={`w-full border border-theme text-theme-secondary hover:text-theme-primary font-medium text-s2 py-3 rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm ${loading
                  ? 'ai-loading-btn border-theme-accent/20 text-theme-accent'
                  : 'bg-theme-card hover:bg-theme'
                  }`}
              >
                <Sparkles
                  size={13}
                  className={`transition-colors duration-300 ${loading
                    ? 'text-theme-accent animate-spin [animation-duration:3s]'
                    : hasUnsavedChanges
                      ? 'text-theme-accent'
                      : 'text-theme-muted'
                    }`}
                />
                <span>Save Note</span>
              </button>
            </form>
            {/* 
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setForceShowInput(false);
                  setStatusMessage(null);
                }}
                className="w-full bg-transparent hover:bg-theme-card/50 border border-theme text-theme-muted hover:text-theme-secondary text-[11px] py-2.5 rounded-xl font-mono tracking-wide transition-colors"
              >
                &larr; Return to pending review panel ({pendingCount})
              </button>
            )} */}
          </div>

          {/* Timeline Flow Container */}
         {/* <div className="bg-theme-card border border-theme rounded-2xl p-5 space-y-5 shadow-inner transition-all duration-300">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <span className="text-s2 font-mono tracking-wider uppercase text-theme-secondary flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-theme-accent" />
                Active Memory Engine
              </span>
              <span className="text-s1 text-theme-muted font-mono tracking-wide">How it works</span>
            </div>

            <div className="relative pl-2 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-theme">
            
              <div className="relative flex items-start gap-4">
                <div className="absolute left-0 w-6 h-6 rounded-lg bg-theme border border-theme text-s3 font-mono text-theme-secondary flex items-center justify-center font-medium shadow-sm z-10">
                  1
                </div>
                <div className="pl-9 space-y-0.5">
                  <h4 className="text-s3 font-medium text-zinc-300 flex items-center gap-1.5">
                    <Brain size={12} className="text-theme-muted" />
                    <span>Log Your Study</span>
                  </h4>
                  <p className="text-s2 font-sans text-theme-muted leading-relaxed tracking-wide">
                    Write down what you learned today in your own words. It only takes two minutes, and our engine instantly finds the key topics.
                  </p>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="absolute left-0 w-6 h-6 rounded-lg bg-theme border border-theme text-s3 font-mono text-theme-secondary flex items-center justify-center font-medium shadow-sm z-10">
                  2
                </div>
                <div className="pl-9 space-y-0.5">
                  <h4 className="text-s3 font-medium text-zinc-300 flex items-center gap-1.5">
                    <Target size={12} className="text-theme-muted" />
                    <span>Auto-Create Cards</span>
                  </h4>
                  <p className="text-s2 font-sans text-theme-muted leading-relaxed tracking-wide">
                    The engine automatically turns those topics into clear concepts and generates smart flashcards for your review.
                  </p>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="absolute left-0 w-6 h-6 rounded-lg bg-theme border border-theme text-s3 font-mono text-theme-secondary flex items-center justify-center font-medium shadow-sm z-10">
                  3
                </div>
                <div className="pl-9 space-y-0.5">
                  <h4 className="text-s3 font-medium text-zinc-300 flex items-center gap-1.5">
                    <CalendarDays size={12} className="text-theme-muted" />
                    <span>Lock Into Memory</span>
                  </h4>
                  <p className="text-s2 font-sans text-theme-muted leading-relaxed tracking-wide">
                    The system will push your review right before you forget it, locking the knowledge into your long-term memory.
                  </p>
                </div>
              </div>
            </div>
          </div> */}
        </div>

      </div>
    </div>
  );
}