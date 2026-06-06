import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, History, Calendar, Edit2, Check, X, Trash2, ChevronDown } from 'lucide-react';

export default function ConceptDetail({ concept, onBack, onSave, onDelete }) {
  const [animateIn, setAnimateIn] = useState(false);
  const [activeField, setActiveField] = useState(null); // 'mainNote' | 'extraNote' | null

  // Protective temporary state to confirm delete on a dual-tap cycle
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [draft, setDraft] = useState({
    mainNote: concept?.mainNote || '',
    extraNote: concept?.extraNote || ''
  });
  const [tempValue, setTempValue] = useState('');

  // Track scroll position to dynamically manage the visual indicator layout
  const textareaRef = useRef(null);
  const [hasMoreContentBelow, setHasMoreContentBelow] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Reset delete confirmation safety latch if workspace editing is activated
  useEffect(() => {
    if (activeField) setIsConfirmingDelete(false);
  }, [activeField]);

  // Auditor to check if content exceeds the viewport boundary limits
  const checkScrollOverflow = () => {
    const el = textareaRef.current;
    if (!el) return;
    
    // Check if total height of text content is greater than visible box height
    const isOverflowing = el.scrollHeight > el.clientHeight;
    // Check if the user has scrolled near the absolute bottom boundary
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
    
    setHasMoreContentBelow(isOverflowing && !isAtBottom);
  };

  // Click handler to smoothly scroll the textarea viewport directly to the bottom
  const scrollToBottom = () => {
    const el = textareaRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Re-run the overflow check whenever workspace text edits happen
  useEffect(() => {
    if (activeField) {
      setTimeout(checkScrollOverflow, 50);
    }
  }, [activeField, tempValue]);

  if (!concept) return null;

  const handleAnimatedBack = () => {
    setAnimateIn(false);
    setTimeout(onBack, 240);
  };

  const startEditing = (field, currentVal) => {
    setTempValue(currentVal);
    setActiveField(field);
  };

  const commitFieldUpdate = (field) => {
    setDraft(prev => ({ ...prev, [field]: tempValue }));
    setActiveField(null);
  };

  const handleGlobalSave = () => {
    setActiveField(null);
    if (onSave) {
      onSave({
        ...concept,
        mainNote: draft.mainNote,
        extraNote: draft.extraNote
      });
    }
  };

  const handleDeleteClick = () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
    } else {
      setAnimateIn(false);
      setTimeout(() => {
        if (onDelete) onDelete(concept.id || concept);
      }, 240);
    }
  };

  const formattedNotes = draft.extraNote ? draft.extraNote.replace(/\. /g, '.\n') : '';

  const renderKeyNotes = (notes) => {
    if (!notes) return null;
    const points = Array.isArray(notes) ? notes : notes.split('\n').filter(p => p.trim() !== '');
    return (
      <ul className="space-y-3">
        {points.map((point, index) => (
          <li key={index} className="flex gap-3 text-s3 text-zinc-400 leading-relaxed font-sans items-start">
            <span className="flex-1 text-zinc-400">{point.replace(/^[•\-\d.\s]+/, '')}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={`w-full max-w-xl mx-auto pb-20 relative transform will-change-transform antialiased selection:bg-zinc-800 selection:text-white transition-all duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)]
      ${animateIn ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[0.98]'}`}
    >
      
      {/* Structural Header Layout */}
      <div className="border-b border-zinc-800/60 pb-5 flex items-center justify-between gap-4 min-h-[56px] relative z-20 bg-transparent">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button onClick={handleAnimatedBack} className="text-zinc-500 hover:text-white transition-colors active:scale-90 p-1 -ml-1 rounded-md shrink-0">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-semibold tracking-tight text-zinc-100 text-s4 truncate max-w-[160px] sm:max-w-none">
            {concept.conceptName}
          </h1>
        </div>
        
        {/* Actions Cluster: Minimal Destructive and Save Utility */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDeleteClick}
            onMouseLeave={() => setIsConfirmingDelete(false)}
            className={`p-2 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center border
              ${isConfirmingDelete 
                ? 'bg-red-950/30 border-red-800/60 text-red-400' 
                : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-400'
              }`}
            title={isConfirmingDelete ? "Click again to confirm delete" : "Delete concept"}
          >
            <Trash2 size={16} />
          </button>

          <button 
            onClick={handleGlobalSave}
            className="bg-theme-card border border-theme text-theme-secondary hover:text-theme-primary hover:bg-theme font-medium text-s2 px-4 py-1.5 rounded-xl transition-all active:scale-[0.96] flex items-center gap-1.5 shadow-sm font-sans tracking-wide shrink-0"
          >
            <Check size={12} className="text-theme-accent" />
            <span>Save Concept</span>
          </button>
        </div>
      </div>

      {/* Shared Absolute Presentation Track Wrapper */}
      <div className="relative mt-6 min-h-[400px] overflow-visible">
        
        {/* VIEW 1: Main Content Section Container */}
        <div 
          className={`w-full space-y-6 transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform
            ${activeField 
              ? 'opacity-0 -translate-y-2 pointer-events-none scale-[0.97] absolute inset-x-0 top-0' 
              : 'opacity-100 translate-y-0 scale-100 relative z-10'
            }`}
        >
          {/* Top-level Metadata Metrics */}
          <div className="flex items-center gap-3 text-s2 text-zinc-500 font-mono tracking-wider uppercase px-0.5">
            <div className="flex items-center gap-1.5">
              <History size={12} className="text-zinc-600" />
              <span>{concept.reviewCount} {concept.reviewCount === 1 ? 'Revision' : 'Revisions'}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-zinc-800/80" />
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-zinc-600" />
              <span>{new Date(concept.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Primary Main Content Section */}
          <div className="px-0.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest font-bold">Notes</span>
              <button 
                onClick={() => startEditing('mainNote', draft.mainNote)}
                className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 active:scale-90"
              >
                <Edit2 size={12} />
              </button>
            </div>
            <p className="text-s3 text-zinc-300 leading-relaxed font-normal font-sans">
              {draft.mainNote || "No detailed notes recorded for this study node."}
            </p>
          </div>

          {/* Extra Context Segment */}
          <div className="space-y-3.5 pt-5 border-t border-zinc-800/40 px-0.5">
            <div className="flex justify-between items-center">
              <h3 className="text-s2 text-zinc-500 uppercase tracking-widest font-bold font-mono">
                Key Architecture Insights
              </h3>
              <button 
                onClick={() => startEditing('extraNote', draft.extraNote)}
                className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 active:scale-90"
              >
                <Edit2 size={12} />
              </button>
            </div>
            {draft.extraNote ? renderKeyNotes(formattedNotes) : <div className="text-s2 font-mono text-zinc-600 tracking-wide pt-1">No modular segments mapped.</div>}
          </div>

          {/* Mastery Score UI Component */}
          <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between items-baseline font-mono">
              <span className="text-s2 text-zinc-500 uppercase tracking-widest font-bold">Current Mastery</span>
              <span className="text-sm font-semibold text-zinc-300">{concept.masteryScore}%</span>
            </div>
            <div className="w-full h-[2px] bg-zinc-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-400 rounded-full transition-all duration-500" 
                style={{ width: `${concept.masteryScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* VIEW 2: Premium Isolated Focused Workspace Editor */}
        <div 
          className={`w-full space-y-3 transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform absolute inset-x-0 top-0
            ${activeField 
              ? 'opacity-100 translate-y-0 scale-100 relative z-10' 
              : 'opacity-0 translate-y-2 pointer-events-none scale-[0.98]'
            }`}
        >
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold">
              Editing {activeField === 'mainNote' ? 'Notes' : 'Architecture Insights'}
            </span>
          </div>

          {/* Main Input Framework Container Card */}
          <div className="relative bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-3.5 pb-2 focus-within:border-zinc-700/60 transition-colors duration-200 overflow-hidden">
            
            {/* Height is forced exact via rows={6}, content flows internally */}
            <textarea
              ref={textareaRef}
              rows={6}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onScroll={checkScrollOverflow}
              className="w-full bg-transparent text-s3 text-zinc-300 leading-relaxed font-normal font-sans focus:outline-none resize-none overflow-y-auto scrollbar-none pb-8"
              style={{ WebkitOverflowScrolling: 'touch' }}
              placeholder={activeField === 'extraNote' ? "Separate distinct points with a period." : ""}
            />

            {/* INTERACTIVE FLOATING SCROLL NOTICE BUTTON PANEL */}
            <button 
              type="button"
              onClick={scrollToBottom}
              className={`absolute bottom-[48px] left-1/2 -translate-x-1/2 flex items-center justify-center bg-zinc-900/95 hover:bg-zinc-800 border border-zinc-800/80 rounded-full p-1.5 shadow-lg transform z-20 transition-all duration-300 ease-out active:scale-90
                ${hasMoreContentBelow 
                  ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
                  : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                }`}
            >
              <ChevronDown size={11} className="text-zinc-400 animate-bounce" />
            </button>

            {/* Bottom Action Footer Control Panel Strip */}
            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-900/60 relative z-10 bg-transparent">
              <button 
                onClick={() => setActiveField(null)} 
                className="text-zinc-500 hover:text-zinc-400 p-1.5 rounded-lg transition-colors active:scale-90"
              >
                <X size={16} />
              </button>
              <button 
                onClick={() => commitFieldUpdate(activeField)} 
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg transition-colors active:scale-90"
              >
                <Check size={16} />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}