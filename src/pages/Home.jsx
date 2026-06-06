import React, { useRef, useState, useEffect } from 'react';
import { BookOpen, Flame, Plus, Sparkles, Brain, Target, CalendarDays, Edit2, ChevronDown } from 'lucide-react';
import { useHomeEngine } from '../context/HomeContext';
import AddConceptPage from '../components/AddConceptPage';

export default function HomePage({ pendingCount, onNavigateToReview, mainContentRef, onAddConcept }) {
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

  const textareaRef = useRef(null);

  // States for self-contained layout control and text overflow monitoring
  const [showAddConcept, setShowAddConcept] = useState(false);
  const [hasMoreContentBelow, setHasMoreContentBelow] = useState(false);

  // Monitor text scrolling or editing to see if content extends below the crease line
  const checkScrollOverflow = () => {
    const el = textareaRef.current;
    if (!el) return;

    const isOverflowing = el.scrollHeight > el.clientHeight;
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;

    setHasMoreContentBelow(isOverflowing && !isAtBottom);
  };

  // Click handler to smoothly scroll the textarea to the bottom
  const scrollToBottom = () => {
    const el = textareaRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Re-run the layout scanner whenever notes text values change or edit mode toggles
  useEffect(() => {
    if (!showDashboardMode && isEditing) {
      setTimeout(checkScrollOverflow, 50);
    }
  }, [noteText, isEditing, forceShowInput, pendingCount]);

  const handleSave = (e) => {
    e.preventDefault();
    
    const topicsArray = noteText
      ? noteText
          .split('\n')
          .map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('-')) {
              return trimmed.substring(1).trim();
            }
            return trimmed;
          })
          .filter(line => line.length > 0)
      : [];

    const requestBody = {
      topics: topicsArray
    };

    handleSaveNote(requestBody);
  };

  const showDashboardMode = pendingCount > 0 && !forceShowInput;
  const isInputDisabled = loading || isInitialFetching || !isEditing;

  const handleKeyDown = (e) => {
    const textarea = e.target;
    const { selectionStart, value } = textarea;

    const textBeforeCursor = value.substring(0, selectionStart);
    const textAfterCursor = value.substring(selectionStart);
    const linesBefore = textBeforeCursor.split('\n');
    const currentLine = linesBefore[linesBefore.length - 1];

    if (e.key === 'Enter') {
      if (currentLine.trim() === '-' || currentLine.trim() === '') {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      
      const newLineAddition = '\n- ';
      const newText = textBeforeCursor + newLineAddition + textAfterCursor;
      const newCursorPos = selectionStart + newLineAddition.length;

      setNoteText(newText);

      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        if (textAfterCursor.length === 0) {
          textarea.scrollTop = textarea.scrollHeight;
        }
        checkScrollOverflow();
      }, 0);
    }

    if (e.key === 'Backspace') {
      if (currentLine === '- ' || currentLine === '-') {
        e.preventDefault();
        
        const lineStartIndex = selectionStart - currentLine.length;
        const newText = value.substring(0, lineStartIndex) + textAfterCursor;
        
        setNoteText(newText);

        setTimeout(() => {
          textarea.setSelectionRange(lineStartIndex, lineStartIndex);
          checkScrollOverflow();
        }, 0);
      }
    }
  };

  const handleTextareaChange = (e) => {
    const inputValue = e.target.value;
    const textarea = e.target;
    
    if (!inputValue || inputValue.trim() === '') {
      setNoteText('');
      setHasMoreContentBelow(false);
      return;
    }
    
    if (inputValue.length === 1 && inputValue !== '-') {
      setNoteText('- ' + inputValue.toUpperCase());
      setTimeout(() => {
        textarea.setSelectionRange(3, 3);
        checkScrollOverflow();
      }, 0);
      return;
    }

    const originalSelectionStart = textarea.selectionStart;
    const lines = inputValue.split('\n');
    const formattedLines = lines.map((line) => {
      if (line === '') return line;
      
      let processedLine = line;
      const trimmed = line.trimStart();
      
      if (trimmed.length > 0 && !trimmed.startsWith('-')) {
        processedLine = '- ' + line;
      }

      if (processedLine.startsWith('- ')) {
        const contentText = processedLine.substring(2);
        if (contentText.length > 0) {
          processedLine = '- ' + contentText.charAt(0).toUpperCase() + contentText.slice(1);
        }
      } else if (processedLine.startsWith('-')) {
        const contentText = processedLine.substring(1);
        if (contentText.length > 0) {
          processedLine = '-' + contentText.charAt(0).toUpperCase() + contentText.slice(1);
        }
      }
      
      return processedLine;
    });

    const finalValue = formattedLines.join('\n');
    setNoteText(finalValue);

    const lengthDifference = finalValue.length - inputValue.length;
    setTimeout(() => {
      const adjustedCursorPos = originalSelectionStart + lengthDifference;
      textarea.setSelectionRange(adjustedCursorPos, adjustedCursorPos);
      checkScrollOverflow();
    }, 0);
  };

  const handleConceptSave = (conceptData) => {
    if (onAddConcept) {
      onAddConcept(conceptData);
    }
  };

  if (showAddConcept) {
    return (
      <AddConceptPage
        onBack={() => setShowAddConcept(false)} 
        onSave={handleConceptSave} 
      />
    );
  }

  return (
    <div className="space-y-6 min-h-[350px] max-w-xl mx-auto pb-12 text-theme-primary select-none transition-all duration-300 ease-in-out">

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
      <div className="border-b border-theme pb-5 flex justify-between items-end gap-4 transition-all duration-300">
        <div>
          <h1 className="text-s6 font-semibold tracking-tight text-theme-primary transition-opacity duration-200">
            {showDashboardMode ? 'Workspace Dashboard' : 'Knowledge Logging'}
          </h1>
          <p className="text-s2 text-theme-muted font-sans tracking-wide mt-1 transition-opacity duration-200">
            {showDashboardMode
              ? 'Knowledge baseline status update.'
              : 'Convert natural language daily logs into review anchors.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddConcept(true)}
          className="text-s1 font-mono uppercase tracking-widest text-theme-muted hover:text-theme-accent transition-colors flex items-center gap-1 px-2.5 py-1.5 bg-theme-card border border-theme rounded-lg shrink-0 active:scale-[0.98]"
        >
          <Plus size={11} />
          <span>Concept</span>
        </button>
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
              
              {/* Workspace Container Card */}
              <div className="bg-theme-card border border-theme rounded-2xl p-5 pb-2 focus-within:border-theme transition-colors relative select-text shadow-sm overscroll-contain overflow-hidden">
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

                {/* Fixed visual box footprint: Content scrolls smoothly inside rows={5} */}
                <textarea
                  ref={textareaRef}
                  required
                  rows={5}
                  value={noteText}
                  disabled={isInputDisabled}
                  onKeyDown={handleKeyDown}
                  onChange={handleTextareaChange}
                  onScroll={checkScrollOverflow}
                  placeholder={isInitialFetching ? "Syncing baseline..." : "- Type topics learned today.."}
                  inputMode="text"
                  autoComplete="on"
                  autoCorrect="on"
                  spellCheck={true}
                  className="w-full bg-transparent text-s3 text-theme-primary placeholder-theme-muted/50 resize-none focus:outline-none leading-relaxed tracking-wide disabled:opacity-50 select-text font-sans overscroll-contain overflow-y-auto scrollbar-none pb-7"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                />

                {/* INTERACTIVE FLOATING SCROLL NOTICE BUTTON */}
                <button 
                  type="button"
                  onClick={scrollToBottom}
                  className={`absolute bottom-[10px] left-1/2 -translate-x-1/2 flex items-center justify-center bg-zinc-900/95 hover:bg-zinc-800 border border-zinc-800/80 rounded-full p-1.5 shadow-lg transform z-20 transition-all duration-300 ease-out active:scale-90
                    ${hasMoreContentBelow 
                      ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
                      : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                    }`}
                >
                  <ChevronDown size={12} className="text-zinc-400 animate-bounce" />
                </button>
              </div>

              {/* Minimal Action Button Layer */}
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
          </div>

          {(pendingCount > 0 && hasExistingEntry) && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-s1 font-mono uppercase tracking-wider text-amber-400">
                  Draft Note
                </span>
              </div>

              <p className="text-s1 text-theme-muted mt-1 leading-relaxed">
                This note is currently a draft. Complete all pending revisions before midnight to keep it. Unfinished draft notes are automatically deleted at the end of the day.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}