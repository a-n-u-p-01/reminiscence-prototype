import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Check, X, Trash2, ChevronDown, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { noteService } from '../api/noteService'; 
import { useHomeEngine } from '../context/HomeContext';

export default function ConceptDetail({ concept, onBack, onSave, onDelete }) {
  const [activeInlineField, setActiveInlineField] = useState(null);
  const [inlineValue, setInlineValue] = useState('');
  const [initialTextareaHeight, setInitialTextareaHeight] = useState('auto');

  // Unified Modal Engine State: null | 'delete' | 'save' | 'regen' | 'discard'
  const [activeModalType, setActiveModalType] = useState(null); 
  
  const [isSaving, setIsSaving] = useState(false); 
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('MISTRAL_AI');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { setStatusMessage } = useHomeEngine();

  const [draft, setDraft] = useState({
    question: concept?.question || '',
    mainNote: concept?.mainNote || '',
    extraNote: concept?.extraNote || ''
  });

  const dropdownRef = useRef(null);
  const textareaRef = useRef(null); 
  const displayContainerRef = useRef(null); 
  const providers = ['MISTRAL_AI', 'CLOUDFLARE', 'SILICONFLOW', 'GROQ', 'GEMINI', 'GITHUBMODELS'];

  const isDirty = 
    draft.question !== (concept?.question || '') ||
    draft.mainNote !== (concept?.mainNote || '') ||
    draft.extraNote !== (concept?.extraNote || '');

  // Automatically adjust height of the textarea to fit subsequent dynamic content updates
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; 
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inlineValue]);

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

  if (!concept) return null;

  const startInlineEditing = (field, currentVal) => {
    if (displayContainerRef.current) {
      const currentDisplayHeight = displayContainerRef.current.clientHeight;
      setInitialTextareaHeight(`${currentDisplayHeight}px`);
    } else {
      setInitialTextareaHeight('auto');
    }

    const valueToEdit = field === 'extraNote' 
      ? formatForEditor(currentVal)
      : (currentVal || '');
      
    setInlineValue(valueToEdit);
    setActiveInlineField(field);
  };

  const commitInlineFieldUpdate = (field) => {
    setDraft(prev => ({ ...prev, [field]: inlineValue }));
    setActiveInlineField(null);
  };

  const formatForEditor = (text) => {
    if (!text) return '';
    
    const cleanedText = text
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const points = cleanedText
      .split(/(?<=\.)\s+(?=[A-Z])/)
      .filter(Boolean);

    return points.map(p => p.trim()).join('\n');
  };

  const handleGlobalSave = async () => {
    if (!isDirty) return;
    setIsSaving(true);

    const payload = {
      conceptId: concept.conceptId || concept.id, 
      conceptName: concept.conceptName || concept.name,
      question: draft.question,
      mainNote: draft.mainNote,
      extraNote: draft.extraNote
    };

    try {
      await noteService.upsertConcept(payload);
      setActiveModalType(null);
      if (onSave) onSave({ ...concept, ...draft });
      setStatusMessage({ text: 'Changes Saved Successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to persist global save node modifications:', error);
      setStatusMessage({ text: 'Unable to save field alterations', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 1000);
    }
  };

  const executeDiscardChanges = () => {
    setDraft({
      question: concept?.question || '',
      mainNote: concept?.mainNote || '',
      extraNote: concept?.extraNote || ''
    });
    setActiveInlineField(null);
    setActiveModalType(null);
    if (setStatusMessage) {
      setStatusMessage({ text: 'Changes discarded', type: 'success' });
      setTimeout(() => setStatusMessage(null), 1000);
    }
  };

  const executeAIRegeneration = async () => {
    const targetId = concept.conceptId || concept.id;
    if (!targetId) return;

    setActiveInlineField(null);
    setIsRegenerating(true);
    setIsDropdownOpen(false);
    setActiveModalType(null);

    try {
      const data = await noteService.regenerateConcept(targetId, selectedProvider);
      setDraft({
        question: data.question || '',
        mainNote: data.mainNote || '',
        extraNote: data.extraNote || ''
      });
      setStatusMessage({ text: 'Regenerated! (Unsaved Changes)', type: 'success' });
    } catch (error) {
      console.error('AI regeneration sequence failed:', error);
      setStatusMessage({ text: 'Regeneration failed', type: 'error' });
    } finally {
      setIsRegenerating(false);
      setTimeout(() => setStatusMessage(null), 1500);
    }
  };

  const handleExecuteDeletion = async () => {
    const targetId = concept.conceptId || concept.id;
    if (!targetId) return;

    setIsSaving(true);
    try {
      await noteService.deleteConcept(targetId);
      setActiveModalType(null);
      if (onDelete) onDelete(targetId);
      if (onBack) onBack();
    } catch (error) {
      console.error('Failed to purge designated data node context:', error);
      if (setStatusMessage) setStatusMessage({ text: 'Delete failed', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => { if (setStatusMessage) setStatusMessage(null); }, 1000);
    }
  };

  const renderKeyNotes = (notes) => {
    if (!notes) return <div className="text-s2 font-mono text-zinc-600 tracking-wide pt-1">No modular segments mapped.</div>;

    const cleanedText = notes
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const points = cleanedText
      .split(/(?<=\.)\s+(?=[A-Z])/)
      .filter(Boolean);

    return (
      <ul className="space-y-2.5 pt-1">
        {points.map((point, index) => (
          <li key={index} className="text-s3 text-zinc-400 leading-relaxed flex items-start gap-2">
            <span className="text-zinc-600 font-mono mt-0.5 select-none">▪</span>
            <span>{point.trim()}</span>
          </li>
        ))}
      </ul>
    );
  };

  const modalConfigs = {
    delete: {
      title: 'Delete Concept',
      desc: <>Are you sure you want to remove <span className="text-zinc-200 font-medium">"{concept.conceptName || concept.name}"</span>? This action cannot be undone.</>,
      confirmText: 'Delete',
      confirmClass: 'text-red-400 bg-red-950/20 border-red-900/40 hover:bg-red-950/40',
      onConfirm: handleExecuteDeletion,
      showLoader: isSaving,
      loaderClass: 'text-red-400'
    },
    save: {
      title: 'Save Changes',
      desc: <>Are you sure you want to save all modified adjustments to <span className="text-zinc-200 font-medium">"{concept.conceptName || concept.name}"</span>?</>,
      confirmText: 'Confirm',
      confirmClass: 'text-amber-400 bg-amber-950/20 border-amber-900/40 hover:bg-amber-950/40',
      onConfirm: handleGlobalSave,
      showLoader: isSaving,
      loaderClass: 'text-amber-400'
    },
    regen: {
      title: 'Unsaved Changes',
      desc: 'You have modified this concept layout. Your current unsaved local adjustments will be replaced by the AI output.',
      confirmText: 'Regen anyway',
      confirmClass: 'text-amber-400 bg-amber-950/30 border-amber-800/60 hover:bg-amber-950/50',
      onConfirm: executeAIRegeneration,
      showIcon: <AlertTriangle size={20} className="text-amber-500 mb-1" />
    },
    discard: {
      title: 'Discard Changes',
      desc: <>Are you sure you want to revert all your unsaved edits on <span className="text-zinc-200 font-medium">"{concept.conceptName || concept.name}"</span>?</>,
      confirmText: 'Discard',
      confirmClass: 'text-red-400 bg-red-950/20 border-red-900/40 hover:bg-red-950/40',
      onConfirm: executeDiscardChanges
    }
  };

  const currentModal = modalConfigs[activeModalType];
  const isAnyModalOpen = !!activeModalType;

  return (
    <div className="w-full max-w-xl lg:max-w-2xl mx-auto pb-20 px-4 sm:px-0 relative antialiased select-text selection:bg-zinc-800 selection:text-white">
      
      {/* UNIFIED DYNAMIC CONFIRMATION MODAL OVERLAY */}
      <div className={`fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-md flex flex-col items-center justify-start pt-28 p-6 text-center transition-all duration-200 ${isAnyModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`w-full max-w-xs bg-zinc-900 border border-zinc-800/90 rounded-2xl p-5 shadow-2xl space-y-4 transition-all duration-200 transform ${isAnyModalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'}`}>
          <div className="space-y-1.5 flex flex-col items-center">
            {currentModal?.showIcon}
            <h4 className="text-s4 font-semibold text-zinc-100 tracking-tight">{currentModal?.title}</h4>
            <div className="text-s2 text-zinc-400 leading-relaxed px-1">{currentModal?.desc}</div>
          </div>
          <div className="flex items-center gap-2.5 pt-1">
            <button type="button" disabled={isSaving} onClick={() => setActiveModalType(null)} className="flex-1 text-s2 font-mono uppercase tracking-wider font-bold text-zinc-400 bg-zinc-950 border border-zinc-800/60 hover:bg-zinc-800/40 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-40 cursor-pointer">Cancel</button>
            <button type="button" disabled={isSaving} onClick={currentModal?.onConfirm} className={`flex-1 text-s2 font-mono uppercase tracking-wider font-bold border py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 cursor-pointer ${currentModal?.confirmClass}`}>
              {currentModal?.showLoader ? <Loader2 size={12} className={`animate-spin ${currentModal.loaderClass}`} /> : currentModal?.confirmText}
            </button>
          </div>
        </div>
      </div>

      {/* CORE WRAPPER SCREEN LAYOUT */}
      <div className={`w-full transition-all duration-200 ${isAnyModalOpen ? 'scale-[0.99] opacity-30 pointer-events-none select-none filter blur-[0.5px]' : 'scale-100 opacity-100'}`}>
        
        {/* HYPER-MINIMAL TWO-ROW STRUCTURAL TOOLBAR */}
        <div className="border-b border-zinc-800/60 pb-3 space-y-2">
          
          {/* ROW 1: Navigation Left, Secondary Actions Right */}
          <div className="flex items-center justify-between gap-4 min-h-[36px]">
            {/* Left Hand: Title space */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button onClick={onBack} disabled={isSaving || isRegenerating} className="cursor-pointer text-zinc-500 hover:text-white transition-colors active:scale-90 p-1 -ml-1 rounded-md shrink-0 disabled:opacity-40">
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-semibold tracking-tight text-zinc-100 text-base sm:text-s4 truncate leading-snug">
                {concept.conceptName || concept.name}
              </h1>
            </div>
            
            {/* Right Hand: Context Lifecycles */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Global Undo/Discard Trigger */}
              <button type="button" onClick={() => setActiveModalType('discard')} disabled={!isDirty || isSaving || isRegenerating} title="Discard unsaved edits" className={`p-1.5 rounded-lg border transition-all shrink-0 ${isDirty ? 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 active:scale-90 cursor-pointer' : 'border-zinc-800/40 bg-zinc-900/10 text-zinc-600 opacity-50 cursor-not-allowed'}`}>
                <X size={12} />
              </button>

              <span className="w-[1px] h-3.5 bg-zinc-800/40 mx-0.5 shrink-0" />

              {/* Context Deletion Icon */}
              <button type="button" onClick={() => setActiveModalType('delete')} disabled={isSaving || isRegenerating || activeInlineField !== null} className="p-1.5 rounded-lg transition-all duration-200 active:scale-90 flex items-center justify-center border border-transparent text-zinc-500 hover:text-red-400 hover:bg-zinc-900/40 disabled:opacity-20 shrink-0 cursor-pointer">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* ROW 2: Ultra-Compact AI Configuration & Micro Save Trigger */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {/* Left Hand: Compact Dropdown and Sparkle */}
            <div className="flex items-center gap-1">
              {/* Model Provider Selector Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} disabled={isSaving || isRegenerating || activeInlineField !== null} className="flex items-center justify-between gap-1.5 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700/60 rounded-lg px-2 py-1 focus:outline-none transition-all duration-200 disabled:opacity-40 cursor-pointer">
                  <span className="text-zinc-400 text-[10px] font-mono tracking-wider font-semibold min-w-[75px] sm:min-w-[80px] text-left">{selectedProvider}</span>
                  <ChevronDown size={8} className={`text-zinc-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-zinc-400' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-[135px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="py-0.5 flex flex-col">
                      {providers.map((prov) => (
                        <button key={prov} type="button" onClick={() => { setSelectedProvider(prov); setIsDropdownOpen(false); }} className={`w-full text-left font-mono text-[10px] tracking-wide px-2.5 py-1.5 transition-colors block ${selectedProvider === prov ? 'bg-zinc-800/80 text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'}`}>{prov}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Sparkle Action Trigger */}
              <button type="button" onClick={() => isDirty ? setActiveModalType('regen') : executeAIRegeneration()} disabled={isSaving || isRegenerating || activeInlineField !== null} title="Regenerate data" className={`p-1.5 rounded-lg transition-all duration-300 border bg-zinc-900/40 shrink-0 cursor-pointer ${isRegenerating ? 'border-amber-500/40 bg-amber-950/10' : 'border-zinc-800/50 text-zinc-500 hover:text-amber-400 hover:bg-zinc-800/50 active:scale-90'} disabled:opacity-30`}>
                <Sparkles size={11} className={isRegenerating ? 'animate-spin text-amber-400' : 'text-inherit'} />
              </button>
            </div>

            {/* Right Hand: Premium Micro Save Button */}
            <button type="button" onClick={() => setActiveModalType('save')} disabled={!isDirty || isSaving || isRegenerating} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-sans font-bold uppercase tracking-wider transition-all active:scale-95 border shrink-0 ${isDirty ? 'bg-amber-500 text-zinc-950 border-amber-400 hover:bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer' : 'bg-zinc-900/20 text-zinc-600 border-zinc-800/30 opacity-40 cursor-not-allowed'}`}>
              {isSaving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
              <span>Save Changes</span>
            </button>
          </div>

        </div>

        {/* HIGH REFINEMENT CONTEXTUAL INLINE FIELDS CARD ARCHITECTURE */}
        <div className="mt-5 space-y-5">
          
          {/* INLINE MODULE CARD: QUESTION LAYER */}
          <div className={`p-4 rounded-xl border transition-all duration-200 ${activeInlineField === 'question' ? 'bg-zinc-950 border-zinc-700 ring-1 ring-zinc-800/50' : 'bg-zinc-900/20 border-zinc-800/50 hover:border-zinc-800/80'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold">Question Layer</span>
              {activeInlineField !== 'question' && (
                <button onClick={() => startInlineEditing('question', draft.question)} disabled={isSaving || isRegenerating} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 active:scale-90 cursor-pointer disabled:opacity-30">
                  <Edit2 size={12} />
                </button>
              )}
            </div>
            
            {activeInlineField === 'question' ? (
              <div className="space-y-3">
                <textarea ref={textareaRef} value={inlineValue} onChange={(e) => setInlineValue(e.target.value)} className="w-full bg-transparent text-s3 text-zinc-200 font-sans leading-relaxed border-none outline-none focus:ring-0 p-0 resize-none overflow-hidden whitespace-pre-wrap" style={{ minHeight: initialTextareaHeight }} autoFocus />
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
                  <button onClick={() => setActiveInlineField(null)} className="text-zinc-500 hover:text-zinc-400 p-1 rounded-lg transition-colors cursor-pointer"><X size={14} /></button>
                  <button onClick={() => commitInlineFieldUpdate('question')} className="text-amber-400 hover:text-amber-300 p-1 rounded-lg transition-colors cursor-pointer"><Check size={14} /></button>
                </div>
              </div>
            ) : (
              <p className="text-s3 text-zinc-200 font-medium leading-relaxed font-sans whitespace-pre-wrap">{draft.question || "No primary inquiry assigned to this conceptual space."}</p>
            )}
          </div>

          {/* INLINE MODULE CARD: DETAILED NOTES */}
          <div className={`p-4 rounded-xl border transition-all duration-200 ${activeInlineField === 'mainNote' ? 'bg-zinc-950 border-zinc-700 ring-1 ring-zinc-800/50' : 'bg-zinc-900/20 border-zinc-800/50 hover:border-zinc-800/80'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold">Detailed Notes</span>
              {activeInlineField !== 'mainNote' && (
                <button onClick={() => startInlineEditing('mainNote', draft.mainNote)} disabled={isSaving || isRegenerating} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 active:scale-90 cursor-pointer disabled:opacity-30">
                  <Edit2 size={12} />
                </button>
              )}
            </div>

            {activeInlineField === 'mainNote' ? (
              <div className="space-y-3">
                <textarea ref={textareaRef} value={inlineValue} onChange={(e) => setInlineValue(e.target.value)} className="w-full bg-transparent text-s3 text-zinc-300 font-sans leading-relaxed border-none outline-none focus:ring-0 p-0 resize-none overflow-hidden whitespace-pre-wrap" style={{ minHeight: initialTextareaHeight }} autoFocus />
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
                  <button onClick={() => setActiveInlineField(null)} className="text-zinc-500 hover:text-zinc-400 p-1 rounded-lg transition-colors cursor-pointer"><X size={14} /></button>
                  <button onClick={() => commitInlineFieldUpdate('mainNote')} className="text-amber-400 hover:text-amber-300 p-1 rounded-lg transition-colors cursor-pointer"><Check size={14} /></button>
                </div>
              </div>
            ) : (
              <p className="text-s3 text-zinc-300 leading-relaxed font-normal font-sans whitespace-pre-wrap">{draft.mainNote || "No detailed notes recorded for this study node."}</p>
            )}
          </div>

          {/* INLINE MODULE CARD: KEY ARCHITECTURE INSIGHTS */}
          <div className={`p-4 rounded-xl border transition-all duration-200 ${activeInlineField === 'extraNote' ? 'bg-zinc-950 border-zinc-700 ring-1 ring-zinc-800/50' : 'bg-zinc-900/20 border-zinc-800/50 hover:border-zinc-800/80'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold">Key Architecture Insights</span>
              {activeInlineField !== 'extraNote' && (
                <button onClick={() => startInlineEditing('extraNote', draft.extraNote)} disabled={isSaving || isRegenerating} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 active:scale-90 cursor-pointer disabled:opacity-30">
                  <Edit2 size={12} />
                </button>
              )}
            </div>

            {activeInlineField === 'extraNote' ? (
              <div className="space-y-3">
                <textarea 
                  ref={textareaRef} 
                  value={inlineValue} 
                  onChange={(e) => setInlineValue(e.target.value)} 
                  placeholder="Sentence one. Sentence two." 
                  className="w-full bg-transparent text-s3 text-zinc-300 font-sans leading-relaxed border-none outline-none focus:ring-0 p-0 resize-none overflow-hidden whitespace-pre-wrap pt-1 block style-normal" 
                  style={{ minHeight: initialTextareaHeight }}
                  autoFocus 
                />
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
                  <button onClick={() => setActiveInlineField(null)} className="text-zinc-500 hover:text-zinc-400 p-1 rounded-lg transition-colors cursor-pointer"><X size={14} /></button>
                  <button onClick={() => commitInlineFieldUpdate('extraNote')} className="text-amber-400 hover:text-amber-300 p-1 rounded-lg transition-colors cursor-pointer"><Check size={14} /></button>
                </div>
              </div>
            ) : (
              <div ref={displayContainerRef} className="font-sans text-zinc-300">
                {renderKeyNotes(draft.extraNote)}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}