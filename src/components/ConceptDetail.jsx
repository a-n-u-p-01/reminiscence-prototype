import React, { useRef } from 'react';
import { ArrowLeft, History, Calendar } from 'lucide-react';

export default function ConceptDetail({ concept, onBack }) {
  // Use a ref to track where the touch interaction started
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

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
          <li key={index} className="flex gap-3 text-s3 text-zinc-400 leading-relaxed font-sans items-start group">
            <span className="flex-1 text-zinc-400">{point.replace(/^[•\-\d.\s]+/, '')}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Capture touch start coordinates
  const handleTouchStart = (e) => {
    // touchStartX.current = e.touches[0].clientX;
    // touchStartY.current = e.touches[0].clientY;
  };

  // Evaluate gesture path at touch end
  const handleTouchEnd = (e) => {
    // const touchEndX = e.changedTouches[0].clientX;
    // const touchEndY = e.changedTouches[0].clientY;

    // const deltaX = touchEndX - touchStartX.current;
    // const deltaY = Math.abs(touchEndY - touchStartY.current);

    // // Threshold rules: 
    // // 1. Right swipe direction (deltaX > 70 pixels)
    // // 2. Mostly horizontal movement (deltaX must be greater than vertical shift to prevent scrolling mixups)
    // if (deltaX > 70 && deltaX > deltaY) {
    //   onBack();
    // }
  };

  return (
    <div 
      // onTouchStart={handleTouchStart}
      // onTouchEnd={handleTouchEnd}
      className="w-full pb-20 space-y-6 touch-pan-y relative will-change-transform antialiased selection:bg-zinc-800 selection:text-white"
    >
      {/* Structural Header Layout - Matches Explorer perfectly */}
      <div className="border-b border-zinc-800/60 pb-5 flex items-center justify-between gap-4 min-h-[56px] pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="text-zinc-500 hover:text-white transition-colors active:scale-90 p-1 -ml-1 rounded-md shrink-0">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-semibold tracking-tight text-zinc-100 text-s4 truncate max-w-[200px] sm:max-w-none">
            {concept.conceptName}
          </h1>
        </div>
        
        {/* Dynamic Context Meta Badge */}
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold px-1">
          Detail
        </div>
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
        <div className="px-0.5">
          <p className="text-s3 text-zinc-300 leading-relaxed font-normal font-sans">
            {concept.mainNote || "No detailed notes recorded for this study node."}
          </p>
        </div>

        {/* Extra Context Segment */}
        {concept.extraNote && (
          <div className="space-y-3.5 pt-5 border-t border-zinc-800/40 px-0.5">
            <h3 className="text-s2 text-zinc-500 uppercase tracking-widest font-bold font-mono">
              Key Architecture Insights
            </h3>
            {renderKeyNotes(formattedNotes)}
          </div>
        )}
      </div>
       {/* Mastery Segment - Clean Glass Card Layout Match */}
        <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-4 space-y-2.5">
          <div className="flex justify-between items-baseline font-mono">
            <span className="text-s2 text-zinc-500 uppercase tracking-widest font-bold">Current Mastery</span>
            <span className="text-sm font-semibold text-zinc-300">{concept.masteryScore}%</span>
          </div>
          {/* Progress bar accent layout tracks */}
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