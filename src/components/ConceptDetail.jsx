import React, { useRef, useState } from 'react';
import { ArrowLeft, History, Calendar, Edit2, Check, X } from 'lucide-react';

export default function ConceptDetail({ concept, onBack, onSave }) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Tracks which specific text block is actively undergoing mutation
  const [activeField, setActiveField] = useState(null); // 'mainNote' | 'extraNote' | null

  // Central tracking state variables for the fields
  const [draft, setDraft] = useState({
    mainNote: concept?.mainNote || '',
    extraNote: concept?.extraNote || ''
  });

  // Temporary local state for the block currently being edited
  const [tempValue, setTempValue] = useState('');

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

  // Formats period-separated sentences into fresh line breaks for rendering
  const formattedNotes = draft.extraNote 
    ? draft.extraNote.replace(/\. /g, '.\n') 
    : '';

  const renderKeyNotes = (notes) => {
    if (!notes) return null;
    const points = Array.isArray(notes) 
      ? notes 
      : notes.split('\n').filter(p => p.trim() !== '');

    return (
      <ul className="space-y-3">
        {points.map((point, index) => (
          <li key={index} className="flex gap-3 text-s3 text-zinc-400 leading-relaxed font-sans items-start group">
            <span className="flex-1 text-zinc-400">{point.replace(/^[•\-\d.\s]+/, '')}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="w-full pb-20 space-y-6 touch-pan-y relative will-change-transform antialiased selection:bg-zinc-800 selection:text-white">
      
      {/* Structural Header Layout - Static Title Only */}
      <div className="border-b border-zinc-800/60 pb-5 flex items-center justify-between gap-4 min-h-[56px] pointer-events-auto">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button onClick={onBack} className="text-zinc-500 hover:text-white transition-colors active:scale-90 p-1 -ml-1 rounded-md shrink-0">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-semibold tracking-tight text-zinc-100 text-s4 truncate max-w-[220px] sm:max-w-none">
            {concept.conceptName}
          </h1>
        </div>
        
        {/* Unified Save Action */}
        <button 
          onClick={handleGlobalSave}
          className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold hover:text-zinc-200 transition-colors shrink-0 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md shadow-sm"
        >
          Save
        </button>
      </div>

      {/* Primary Content Grid Space */}
      <div className="space-y-6 pointer-events-auto">
        
        {/* Top-level Metadata Metrics Inline Strip */}
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
            {activeField !== 'mainNote' && (
              <button 
                onClick={() => startEditing('mainNote', draft.mainNote)}
                className="text-zinc-600 hover:text-zinc-400 transition-colors p-1"
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>
          
          {activeField === 'mainNote' ? (
            <div className="space-y-2 bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-2.5">
              <textarea
                rows={4}
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="w-full bg-transparent text-s3 text-zinc-300 leading-relaxed font-normal font-sans focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2 pt-1.5 border-t border-zinc-900/60">
                <button onClick={() => setActiveField(null)} className="text-zinc-500 hover:text-zinc-400 p-1 rounded">
                  <X size={14} />
                </button>
                <button onClick={() => commitFieldUpdate('mainNote')} className="text-zinc-400 hover:text-zinc-200 p-1 rounded">
                  <Check size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-s3 text-zinc-300 leading-relaxed font-normal font-sans">
              {draft.mainNote || "No detailed notes recorded for this study node."}
            </p>
          )}
        </div>

        {/* Extra Context Segment */}
        <div className="space-y-3.5 pt-5 border-t border-zinc-800/40 px-0.5">
          <div className="flex justify-between items-center">
            <h3 className="text-s2 text-zinc-500 uppercase tracking-widest font-bold font-mono">
              Key Architecture Insights
            </h3>
            {activeField !== 'extraNote' && (
              <button 
                onClick={() => startEditing('extraNote', draft.extraNote)}
                className="text-zinc-600 hover:text-zinc-400 transition-colors p-1"
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>

          {activeField === 'extraNote' ? (
            <div className="space-y-2 bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-2.5">
              <textarea
                rows={4}
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="w-full bg-transparent text-s3 text-zinc-300 leading-relaxed font-normal font-sans focus:outline-none resize-none"
                placeholder="Separate distinct points with a period."
              />
              <div className="flex justify-end gap-2 pt-1.5 border-t border-zinc-900/60">
                <button onClick={() => setActiveField(null)} className="text-zinc-500 hover:text-zinc-400 p-1 rounded">
                  <X size={14} />
                </button>
                <button onClick={() => commitFieldUpdate('extraNote')} className="text-zinc-400 hover:text-zinc-200 p-1 rounded">
                  <Check size={14} />
                </button>
              </div>
            </div>
          ) : (
            draft.extraNote ? renderKeyNotes(formattedNotes) : <div className="text-s2 font-mono text-zinc-600 tracking-wide pt-1">No modular segments mapped.</div>
          )}
        </div>
      </div>

      {/* Mastery Segment - Clean Glass Card Layout Match */}
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
  );
}