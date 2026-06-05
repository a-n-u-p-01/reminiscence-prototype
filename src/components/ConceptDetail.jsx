import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function ConceptDetail({ concept, onBack }) {
  if (!concept) return null;



  return (
    <div className="max-w-xs mx-auto py-6 animate-in fade-in duration-500">
      <nav className="flex items-center mb-8">
        <button 
          onClick={onBack} 
          className="text-zinc-600 hover:text-white transition-all duration-300 active:scale-90"
        >
          <ArrowLeft size={22} />
        </button>
      </nav>

      <div className="space-y-10">
        {/* Header Section */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-zinc-100 leading-tight">
            {concept.conceptName}
          </h2>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono uppercase tracking-[0.2em]">
            <span>Mastery</span>
            <span className="text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-sm">
              {concept.masteryScore}%
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-3">
          <h3 className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-bold">
            Notes
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed font-light">
            {concept.notes || "No detailed notes recorded for this study node."}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-zinc-900/50">
          <div className="space-y-1">
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Revisions</div>
            <div className="text-lg text-zinc-300 font-mono font-medium">
              {concept.reviewCount}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Created</div>
            <div className="text-lg text-zinc-300 font-mono font-medium">
              {new Date(concept.createdAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}