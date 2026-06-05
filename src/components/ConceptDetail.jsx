import React from 'react';
import { ArrowLeft, History, Calendar } from 'lucide-react';

export default function ConceptDetail({ concept, onBack }) {
  if (!concept) return null;

  // Formats period-separated sentences into fresh line breaks for rendering
  const formattedNotes = concept.extraNote 
    ? concept.extraNote.replace(/\. /g, '.\n') 
    : '';

  const renderKeyNotes = (notes) => {
    if (!notes) return null;
    const points = Array.isArray(notes) 
      ? notes 
      : notes.split('\n').filter(p => p.trim() !== '');

    return (
      <ul className="space-y-3">
        {points.map((point, index) => (
          <li key={index} className="flex gap-3 text-sm text-zinc-400 leading-relaxed font-sans items-start group">
            {/* <span className="w-1 h-1 rounded-full bg-zinc-600 mt-2.5 shrink-0 transition-colors group-hover:bg-zinc-400" / */}
            <span className="flex-1">{point.replace(/^[•\-\d.\s]+/, '')}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="max-w-xs mx-auto py-6 antialiased selection:bg-zinc-800 selection:text-white">
      {/* Navigation Row */}
      <nav className="flex items-center mb-8">
        <button 
          onClick={onBack} 
          className="group flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 uppercase tracking-widest font-mono transition-all duration-300"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </button>
      </nav>

      <div className="space-y-8">
        {/* Header Block */}
        <div className="space-y-3">
          <h2 className="text-2xl font-medium tracking-tight text-zinc-100 leading-tight">
            {concept.conceptName}
          </h2>
          
          {/* Top-level Metadata Metrics Inline Strip */}
          <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono tracking-wider uppercase">
            <div className="flex items-center gap-1.5">
              <History size={12} className="text-zinc-600" />
              <span>{concept.reviewCount} {concept.reviewCount === 1 ? 'Revision' : 'Revisions'}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-zinc-800" />
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-zinc-600" />
              <span>{new Date(concept.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Mastery Segment - Clean Glass Card Layout */}
        <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-baseline font-mono">
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.25em]">Current Mastery</span>
            <span className="text-base font-semibold text-zinc-200">{concept.masteryScore}%</span>
          </div>
          {/* Progress bar accent layout tracks */}
          <div className="w-full h-[3px] bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-zinc-400 rounded-full transition-all duration-500" 
              style={{ width: `${concept.masteryScore}%` }}
            />
          </div>
        </div>

        {/* Primary Main Content Section */}
        <div className="space-y-2">
          <p className="text-sm text-zinc-300 leading-relaxed font-light font-sans">
            {concept.mainNote || "No detailed notes recorded for this study node."}
          </p>
        </div>

        {/* Extra Context Segment */}
        {concept.extraNote && (
          <div className="space-y-3 pt-6 border-t border-zinc-900">
            <h3 className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-medium font-mono">
              Key Architecture Insights
            </h3>
            {renderKeyNotes(formattedNotes)}
          </div>
        )}
      </div>
    </div>
  );
}