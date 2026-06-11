import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Check, X, Trash2, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { noteService } from '../api/noteService'; 
import { useHomeEngine } from '../context/HomeContext';

export default function ConceptDetail({ concept, onBack, onSave, onDelete }) {
  const [activeField, setActiveField] = useState(null); // 'question' | 'mainNote' | 'extraNote' | null
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('GROQ');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { setStatusMessage } = useHomeEngine();

  const [draft, setDraft] = useState({
    question: concept?.question || '',
    mainNote: concept?.mainNote || '',
    extraNote: concept?.extraNote || ''
  });
  const [tempValue, setTempValue] = useState('');

  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const [hasMoreContentBelow, setHasMoreContentBelow] = useState(false);

  const providers = ['CLOUDFLARE','MISTRAL_AI','SILICONFLOW', 'GROQ', 'GEMINI', 'GITHUBMODELS'];

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setDraft({
      question: concept?.question || '',
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

  const commitFieldUpdate = async (field) => {
    // 1. Calculate the next draft state layout locally
    const nextDraft = {
      ...draft,
      [field]: tempValue
    };

    // 2. Clear out editor views and trigger visual loader state
    setActiveField(null);
    setIsSaving(true);

    const payload = {
      conceptId: concept.conceptId || concept.id, 
      conceptName: concept.conceptName || concept.name,
      question: nextDraft.question,
      mainNote: nextDraft.mainNote,
      extraNote: nextDraft.extraNote
    };

    try {
      await noteService.upsertConcept(payload);
      
      // Update local draft tracking state
      setDraft(nextDraft);

      if (onSave) {
        onSave({
          ...concept,
          ...nextDraft
        });
      }
      setStatusMessage({ text: 'Changes Saved', type: 'success' });
    } catch (error) {
      console.error('Failed to auto-save field update context:', error);
      setStatusMessage({ text: 'Unable to save field changes', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 600);
    }
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

  const handleAIRegenerate = async () => {
    const targetId = concept.conceptId || concept.id;
    if (!targetId) return;

    setActiveField(null);
    setIsRegenerating(true);
    setIsDropdownOpen(false);

    try {
      const data = await noteService.regenerateConcept(targetId, selectedProvider);
      
      const updatedDraft = {
        question: data.question || '',
        mainNote: data.mainNote || '',
        extraNote: data.extraNote || ''
      };

      setDraft(updatedDraft);

      if (onSave) {
        onSave({
          ...concept,
          question: data.question,
          mainNote: data.mainNote,
          extraNote: data.extraNote
        });
      }
      setStatusMessage({ text: 'Regeneration Complete', type: 'success' });
    } catch (error) {
      console.error('AI regeneration sequence failed:', error);
      setStatusMessage({ text: 'Regeneration failed', type: 'error' });
    } finally {
      setIsRegenerating(false);
      setTimeout(() => setStatusMessage(null), 1000);
    }
  };

  const handleExecuteDeletion = async () => {
    const targetId = concept.conceptId || concept.id;
    if (!targetId) return;

    setIsSaving(true);
    try {
      await noteService.deleteConcept(targetId);
      setIsConfirmingDelete(false);

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

  return (
    <div className="cursor-text select-text w-full max-w-xl lg:max-w-2xl mx-auto pb-20 relative antialiased selection:bg-zinc-800 selection:text-white rounded-2xl overflow-hidden">
      
      {/* 1. IMMERSIVE COMPONENT-WIDE GLASS OVERLAY */}
      <div 
        className={`absolute inset-0 z-50 bg-zinc-950/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isConfirmingDelete 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
          }`}
      >
        <div 
          className={`w-full max-w-xs bg-zinc-900 border border-zinc-800/90 rounded-2xl p-6 shadow-2xl space-y-5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform
            ${isConfirmingDelete ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        >
          <div className="space-y-2">
            <h4 className="text-s4 font-semibold text-zinc-100 tracking-tight">Delete Concept</h4>
            <p className="text-s2 text-zinc-400 leading-relaxed px-1">
              Are you sure you want to remove <span className="text-zinc-200 font-medium">"{concept.conceptName || concept.name}"</span>? This action cannot be undone.
            </p>
          </div>
          
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsConfirmingDelete(false)}
              className="flex-1 text-s2 font-mono uppercase tracking-wider font-bold text-zinc-400 bg-zinc-950 border border-zinc-800/60 hover:bg-zinc-800/40 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleExecuteDeletion}
              className="flex-1 text-s2 font-mono uppercase tracking-wider font-bold text-red-400 bg-red-950/20 border border-red-900/40 hover:bg-red-950/40 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {isSaving ? <Loader2 size={12} className="animate-spin text-red-400" /> : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. BACKGROUND STRUCTURE WRAPPER */}
      <div 
        className={`w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform
          ${isConfirmingDelete ? 'scale-[0.985] opacity-40 pointer-events-none select-none' : 'scale-100 opacity-100'}`}
      >
        
        {/* Standardized Header Utility Interface */}
        <div className="border-b border-zinc-800/60 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-h-[56px] relative z-20 bg-transparent">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <button 
              onClick={onBack} 
              disabled={isSaving || isRegenerating}
              className="cursor-pointer text-zinc-500 hover:text-white transition-colors active:scale-90 p-1 -ml-1 rounded-md shrink-0 disabled:opacity-40"
            >
              <ArrowLeft className='cursor-pointer' size={22} />
            </button>
            <h1 className="select-text cursor-text font-semibold tracking-tight text-zinc-100 text-s4 truncate max-w-[160px] sm:max-w-none">
              {concept.conceptName || concept.name}
            </h1>
          </div>
          
          {/* Action Row - Integrated Dropdown and Regenerate controls */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {isSaving && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900/60 border border-zinc-800/40 rounded-lg text-[11px] font-mono text-zinc-500">
                <Loader2 size={11} className="animate-spin text-amber-500/80" />
                <span>Saving...</span>
              </div>
            )}

            {/* Fully Custom High-Aesthetic Dropdown Menu Selection Layer */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isSaving || isRegenerating || isConfirmingDelete}
                className="flex items-center justify-between gap-2 bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-xl px-3 py-1.5 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-800/50 transition-all duration-200 select-none disabled:opacity-40 cursor-pointer"
              >
                <span className="text-zinc-300 text-[11px] font-mono tracking-wider font-semibold min-w-[90px] text-left cursor-pointer">
                  {selectedProvider}
                </span>
                <ChevronDown 
                  size={11} 
                  className={`text-zinc-500 transition-transform duration-200 cursor-pointer ${isDropdownOpen ? 'rotate-180 text-zinc-400' : ''}`} 
                />
              </button>

              {/* Float Panel Layer */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-[145px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-30 animate-in fade-in slide-in-from-top-1 duration-150 ease-out cursor-pointer">
                  <div className="py-1 flex flex-col cursor-pointer">
                    {providers.map((prov) => (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => {
                          setSelectedProvider(prov);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left font-mono text-[11px] tracking-wide px-3 py-2 transition-colors cursor-pointer block
                          ${selectedProvider === prov 
                            ? 'bg-zinc-800/80 text-amber-400 font-bold cursor-pointer' 
                            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 cursor-pointer'
                          }`}
                      >
                        {prov}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Self-Animating AI Sparkle Action Trigger */}
            <button
              type="button"
              onClick={handleAIRegenerate}
              disabled={isSaving || isRegenerating || isConfirmingDelete}
              title="Regenerate context content using selected model"
              className={`p-2 rounded-xl transition-all duration-300 border bg-zinc-900 shrink-0 cursor-pointer
                ${isRegenerating 
                  ? 'border-amber-500/40 bg-amber-950/10 shadow-[0_0_12px_rgba(245,158,11,0.1)]' 
                  : 'border-zinc-800 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/50 active:scale-90'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <Sparkles 
                size={15} 
                className={`transition-all duration-500 cursor-pointer
                  ${isRegenerating ? 'animate-spin text-amber-400 scale-110 ease-in-out' : 'text-inherit'}`} 
              />
            </button>

            <span className="w-[1px] h-5 bg-zinc-800/80 mx-0.5 shrink-0" />

            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              disabled={isSaving || isRegenerating || isConfirmingDelete}
              className="p-2 rounded-xl transition-all duration-200 active:scale-90 flex items-center justify-center border bg-transparent border-transparent text-zinc-500 hover:text-red-400 hover:bg-zinc-900/40 disabled:opacity-20 cursor-pointer"
            >
              <Trash2 size={16} className="cursor-pointer" />
            </button>
          </div>
        </div>

        <div className="relative mt-6 min-h-[400px] overflow-visible">
          {/* VIEW 1: Main Content Viewport */}
          <div 
            className={`w-full space-y-6 transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform
              ${activeField 
                ? 'opacity-0 -translate-y-2 pointer-events-none scale-[0.97] absolute inset-x-0 top-0' 
                : 'opacity-100 translate-y-0 scale-100 relative z-10'
              }`}
          >
            {/* QUESTION CORE BLOCK */}
            <div className="px-0.5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest font-bold">Question</span>
                <button 
                  onClick={() => startEditing('question', draft.question)} 
                  disabled={isSaving || isRegenerating}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 active:scale-90 disabled:opacity-30 cursor-pointer"
                >
                  <Edit2 size={12} className="cursor-pointer" />
                </button>
              </div>
              <p className="text-s3 text-zinc-200 font-medium leading-relaxed font-sans whitespace-pre-wrap">
                {draft.question || "No primary inquiry assigned to this conceptual space."}
              </p>
            </div>

            {/* NOTES CORE BLOCK */}
            <div className="px-0.5 space-y-2 pt-4 border-t border-zinc-800/40">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest font-bold">Notes</span>
                <button 
                  onClick={() => startEditing('mainNote', draft.mainNote)} 
                  disabled={isSaving || isRegenerating}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 active:scale-90 disabled:opacity-30 cursor-pointer"
                >
                  <Edit2 size={12} className="cursor-pointer" />
                </button>
              </div>
              <p className="text-s3 text-zinc-300 leading-relaxed font-normal font-sans whitespace-pre-wrap">
                {draft.mainNote || "No detailed notes recorded for this study node."}
              </p>
            </div>

            {/* INSIGHTS CORE BLOCK */}
            <div className="space-y-3.5 pt-5 border-t border-zinc-800/40 px-0.5">
              <div className="flex justify-between items-center">
                <h3 className="text-s2 text-zinc-500 uppercase tracking-widest font-bold font-mono">Key Architecture Insights</h3>
                <button 
                  onClick={() => startEditing('extraNote', draft.extraNote)} 
                  disabled={isSaving || isRegenerating}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 active:scale-90 disabled:opacity-30 cursor-pointer"
                >
                  <Edit2 size={12} className="cursor-pointer" />
                </button>
              </div>
              {draft.extraNote ? renderKeyNotes(draft.extraNote) : <div className="text-s2 font-mono text-zinc-600 tracking-wide pt-1">No modular segments mapped.</div>}
            </div>
          </div>

          {/* VIEW 2: Inline Editor Context Container */}
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
                className="w-full bg-transparent text-s3 text-zinc-300 leading-relaxed font-normal font-sans focus:outline-none resize-none overflow-y-auto scrollbar-none pb-8 whitespace-pre-wrap"
                style={{ WebkitOverflowScrolling: 'touch' }}
              />

              <div className="flex justify-end gap-3 pt-2 border-t border-zinc-900/60 relative z-10 bg-transparent">
                <button 
                  onClick={() => setActiveField(null)} 
                  className="text-zinc-500 hover:text-zinc-400 p-1.5 rounded-lg transition-colors active:scale-90 cursor-pointer"
                >
                  <X size={16} className="cursor-pointer" />
                </button>
                <button 
                  onClick={() => commitFieldUpdate(activeField)} 
                  className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg transition-colors active:scale-90 cursor-pointer"
                >
                  <Check size={16} className="cursor-pointer" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}