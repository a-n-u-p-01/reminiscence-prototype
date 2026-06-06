import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Check, X, Trash2, ChevronDown } from 'lucide-react';

export default function ConceptDetail({ concept, onBack, onSave, onDelete }) {
  const [activeField, setActiveField] = useState(null); // 'mainNote' | 'extraNote' | null
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [draft, setDraft] = useState({
    mainNote: concept?.mainNote || '',
    extraNote: concept?.extraNote || ''
  });
  const [tempValue, setTempValue] = useState('');

  const textareaRef = useRef(null);
  const [hasMoreContentBelow, setHasMoreContentBelow] = useState(false);

  // Reset delete confirmation safety latch if workspace editing is activated
  useEffect(() => {
    if (activeField) setIsConfirmingDelete(false);
  }, [activeField]);

  const checkScrollOverflow = () => {
    const el = textareaRef.current;
    if (!el) return;
    const isOverflowing = el.scrollHeight > el.clientHeight;
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6;
    setHasMoreContentBelow(isOverflowing && !isAtBottom);
  };

  const scrollToBottom = () => {
    const el = textareaRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (activeField) {
      setTimeout(checkScrollOverflow, 50);
    }
  }, [activeField, tempValue]);

  if (!concept) return null;

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
      if (onDelete) onDelete(concept.id || concept);
    }
  };

  const renderKeyNotes = (notes) => {
    if (!notes) return null;
    const sanitized = notes.replace(/(\d+\.)\n/g, '$1 ');
    const points = sanitized.split('\n').filter(p => p.trim() !== '');
    return (
      <ul className="space-y-3">
        {points.map((point, index) => (
          <li key={index} className="flex gap-3 text-s3 text-zinc-400 leading-relaxed font-sans items-start">
            <span className="flex-1 text-zinc-400 whitespace-pre-wrap">
              {point.trim()}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-20 relative antialiased selection:bg-zinc-800 selection:text-white">
      {/* Structural Header Layout */}
      <div className="border-b border-zinc-800/60 pb-5 flex items-center justify-between gap-4 min-h-[56px] relative z-20 bg-transparent">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button onClick={onBack} className="text-zinc-500 hover:text-white transition-colors active:scale-90 p-1 -ml-1 rounded-md shrink-0">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-semibold tracking-tight text-zinc-100 text-s4 truncate max-w-[160px] sm:max-w-none">
            {concept.conceptName}
          </h1>
        </div>
        
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

      <div className="relative mt-6 min-h-[400px] overflow-visible">
        {/* VIEW 1: Main Content */}
        <div 
          className={`w-full space-y-6 transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform
            ${activeField 
              ? 'opacity-0 -translate-y-2 pointer-events-none scale-[0.97] absolute inset-x-0 top-0' 
              : 'opacity-100 translate-y-0 scale-100 relative z-10'
            }`}
        >
          <div className="px-0.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest font-bold">Notes</span>
              <button onClick={() => startEditing('mainNote', draft.mainNote)} className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 active:scale-90">
                <Edit2 size={12} />
              </button>
            </div>
            <p className="text-s3 text-zinc-300 leading-relaxed font-normal font-sans whitespace-pre-wrap">
              {draft.mainNote || "No detailed notes recorded for this study node."}
            </p>
          </div>

          <div className="space-y-3.5 pt-5 border-t border-zinc-800/40 px-0.5">
            <div className="flex justify-between items-center">
              <h3 className="text-s2 text-zinc-500 uppercase tracking-widest font-bold font-mono">Key Architecture Insights</h3>
              <button onClick={() => startEditing('extraNote', draft.extraNote)} className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 active:scale-90">
                <Edit2 size={12} />
              </button>
            </div>
            {draft.extraNote ? renderKeyNotes(draft.extraNote) : <div className="text-s2 font-mono text-zinc-600 tracking-wide pt-1">No modular segments mapped.</div>}
          </div>
        </div>

        {/* VIEW 2: Editor */}
        <div 
          className={`w-full space-y-3 transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform absolute inset-x-0 top-0
            ${activeField 
              ? 'opacity-100 translate-y-0 scale-100 relative z-10' 
              : 'opacity-0 translate-y-2 pointer-events-none scale-[0.98]'
            }`}
        >
          <div className="relative bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-3.5 pb-2 focus-within:border-zinc-700/60 transition-colors duration-200 overflow-hidden">
            <textarea
              ref={textareaRef}
              rows={6}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onScroll={checkScrollOverflow}
              className="w-full bg-transparent text-s3 text-zinc-300 leading-relaxed font-normal font-sans focus:outline-none resize-none overflow-y-auto scrollbar-none pb-8 whitespace-pre-wrap"
              style={{ WebkitOverflowScrolling: 'touch' }}
            />

            <button 
              type="button"
              onClick={scrollToBottom}
              className={`absolute bottom-[48px] left-1/2 -translate-x-1/2 flex items-center justify-center bg-zinc-900/95 hover:bg-zinc-800 border border-zinc-800/80 rounded-full p-1.5 shadow-lg transform z-20 transition-all duration-300 ease-out active:scale-90
                ${hasMoreContentBelow ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}`}
            >
              <ChevronDown size={11} className="text-zinc-400 animate-bounce" />
            </button>

            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-900/60 relative z-10 bg-transparent">
              <button onClick={() => setActiveField(null)} className="text-zinc-500 hover:text-zinc-400 p-1.5 rounded-lg transition-colors active:scale-90"><X size={16} /></button>
              <button onClick={() => commitFieldUpdate(activeField)} className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg transition-colors active:scale-90"><Check size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}