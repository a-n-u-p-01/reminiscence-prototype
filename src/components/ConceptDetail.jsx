import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Check, X, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { noteService } from '../api/noteService'; 
import { useHomeEngine } from '../context/HomeContext';

export default function ConceptDetail({ concept, onBack, onSave, onDelete }) {
  const [activeField, setActiveField] = useState(null); // 'mainNote' | 'extraNote' | null
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const { setStatusMessage } = useHomeEngine();

  const [draft, setDraft] = useState({
    mainNote: concept?.mainNote || '',
    extraNote: concept?.extraNote || ''
  });
  const [tempValue, setTempValue] = useState('');

  const textareaRef = useRef(null);
  const [hasMoreContentBelow, setHasMoreContentBelow] = useState(false);

  useEffect(() => {
    setDraft({
      mainNote: concept?.mainNote || '',
      extraNote: concept?.extraNote || ''
    });
  }, [concept]);

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
    setTempValue(formatForEditor(currentVal));
    setActiveField(field);
  };

  const commitFieldUpdate = (field) => {
    setDraft(prev => ({ ...prev, [field]: tempValue }));
    setActiveField(null);
  };

  const formatForEditor = (text) => {
    if (!text) return '';
    return text
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\. (?=[A-Z])/g, '.\n\n');
  };

  const handleGlobalSave = async () => {
    setActiveField(null);
    setIsSaving(true);

    const payload = {
      conceptId: concept.conceptId || concept.id, 
      conceptName: concept.conceptName || concept.name,
      mainNote: draft.mainNote,
      extraNote: draft.extraNote
    };

    try {
      await noteService.upsertConcept(payload);

      if (onSave) {
        onSave({
          ...concept,
          mainNote: draft.mainNote,
          extraNote: draft.extraNote
        });
      }
      setStatusMessage({ text: 'Concept Updated', type: 'success' });
    } catch (error) {
      console.error('Failed to update the concept node layout:', error);
      setStatusMessage({ text: 'Unable to update', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 600);
    }
  };

  // Authoritative deletion command processing node
  const handleExecuteDeletion = async () => {
    const targetId = concept.conceptId || concept.id;
    if (!targetId) return;

    setIsSaving(true);
    try {
      await noteService.deleteConcept(targetId);
      setIsConfirmingDelete(false);

      if (setStatusMessage) {
        // setStatusMessage({ text: 'Concept Purged', type: 'success' });
      }

      // Bubble up mutation context BEFORE invoking route history pops
      if (onDelete) onDelete(targetId);
      if (onBack) onBack();
      
    } catch (error) {
      console.error('Failed to purge designated data node context:', error);
      if (setStatusMessage) {
        setStatusMessage({ text: 'Delete failed', type: 'error' });
      }
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        if (setStatusMessage) setStatusMessage(null);
      }, 1000);
    }
  };

  const renderKeyNotes = (notes) => {
    if (!notes) return null;

    const cleanedText = notes
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const points = cleanedText
      .split(/(?<=\.)\s+(?=[A-Z])/)
      .filter(Boolean);

    return (
      <ul className="space-y-3">
        {points.map((point, index) => (
          <li key={index} className="text-s3 text-zinc-400 leading-relaxed">
            {point.trim()}
          </li>
        ))}
      </ul>
    );
  };

  const hasUnsavedChanges = 
    draft.mainNote !== (concept?.mainNote || '') || 
    draft.extraNote !== (concept?.extraNote || '') ||
    (activeField && tempValue !== formatForEditor(draft[activeField]));

  return (
    <div className="w-full max-w-xl mx-auto pb-20 relative antialiased selection:bg-zinc-800 selection:text-white">
      
      {/* Standardized Header Utility Interface */}
      <div className="border-b border-zinc-800/60 pb-5 flex items-center justify-between gap-4 min-h-[56px] relative z-20 bg-transparent">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button 
            onClick={onBack} 
            disabled={isSaving}
            className="text-zinc-500 hover:text-white transition-colors active:scale-90 p-1 -ml-1 rounded-md shrink-0 disabled:opacity-40"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-semibold tracking-tight text-zinc-100 text-s4 truncate max-w-[160px] sm:max-w-none">
            {concept.conceptName || concept.name}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            disabled={isSaving || isConfirmingDelete}
            className="p-2 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center border bg-transparent border-transparent text-zinc-500 hover:text-red-400 hover:bg-zinc-900/40 disabled:opacity-20"
          >
            <Trash2 size={16} />
          </button>

          <button 
            onClick={handleGlobalSave}
            disabled={isSaving || !hasUnsavedChanges || isConfirmingDelete}
            className="bg-theme-card border border-theme text-theme-secondary hover:text-theme-primary hover:bg-theme font-medium text-s2 px-4 py-1.5 rounded-xl transition-all active:scale-[0.96] flex items-center gap-1.5 shadow-sm font-sans tracking-wide shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving && !isConfirmingDelete ? (
              <Loader2 size={12} className="animate-spin text-theme-accent" />
            ) : (
              <Check size={12} className="text-theme-accent" />
            )}
            <span>{'Save Concept'}</span>
          </button>
        </div>
      </div>

      <div className="relative mt-6 min-h-[400px] overflow-visible">
        
        {/* MINIMAL INLINE CONFIRMATION INTERFACE OVERLAY */}
        {isConfirmingDelete && (
          <div className="absolute inset-0 z-30 bg-zinc-950/40 backdrop-blur-[1.5px] rounded-xl flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="max-w-xs bg-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="space-y-1.5">
                <h4 className="text-s3 font-medium text-zinc-200">Delete this concept?</h4>
                <p className="text-s1 font-mono text-zinc-500 uppercase tracking-wider">This action cannot be undone.</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsConfirmingDelete(false)}
                  className="flex-1 text-s2 font-mono uppercase tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800/60 hover:bg-zinc-800/60 py-2 rounded-xl transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleExecuteDeletion}
                  className="flex-1 text-s2 font-mono uppercase tracking-wider text-red-400 bg-red-950/20 border border-red-900/40 hover:bg-red-950/40 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {isSaving ? <Loader2 size={12} className="animate-spin" /> : 'Purge'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 1: Main Content Viewport */}
        <div 
          className={`w-full space-y-6 transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform
            ${activeField || isConfirmingDelete
              ? 'opacity-0 -translate-y-2 pointer-events-none scale-[0.97] absolute inset-x-0 top-0' 
              : 'opacity-100 translate-y-0 scale-100 relative z-10'
            }`}
        >
          <div className="px-0.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest font-bold">Notes</span>
              <button 
                onClick={() => startEditing('mainNote', draft.mainNote)} 
                disabled={isSaving}
                className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 active:scale-90 disabled:opacity-30"
              >
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
              <button 
                onClick={() => startEditing('extraNote', draft.extraNote)} 
                disabled={isSaving}
                className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 active:scale-90 disabled:opacity-30"
              >
                <Edit2 size={12} />
              </button>
            </div>
            {draft.extraNote ? renderKeyNotes(draft.extraNote) : <div className="text-s2 font-mono text-zinc-600 tracking-wide pt-1">No modular segments mapped.</div>}
          </div>
        </div>

        {/* VIEW 2: Inline Editor Context Container */}
        <div 
          className={`w-full space-y-3 transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform absolute inset-x-0 top-0
            ${activeField && !isConfirmingDelete
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