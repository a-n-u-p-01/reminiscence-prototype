import React, { useState, useEffect, useRef } from 'react';
import { Eye, CheckCircle2, ShieldAlert, Smile, Frown, Layers, ArrowLeft } from 'lucide-react';
import { noteService } from '../api/noteService';
import { useReviewEngine } from '../context/ReviewContext';

export default function ReviewScreen({ onBackToHome }) {
  // Pull isolated states dynamically from centralized engine hook
  const { 
    reviewConcepts: concepts, 
    isConceptsLoading: loading, 
    handleSyncData, 
    handleCardReviewed 
  } = useReviewEngine();

  const [showAnswer, setShowAnswer] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const containerRef = useRef(null);
  const activeCard = concepts[0];

  useEffect(() => {
    if (loading || concepts.length > 0) {
      setInitialCheckDone(true);
    } else {
      const timer = setTimeout(() => setInitialCheckDone(true), 180);
      return () => clearTimeout(timer);
    }
  }, [loading, concepts.length]);

  // REMOVED/COMMENTED: Prevents scrolling when a new card loads into view
  useEffect(() => {
    /* if (activeCard && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } */
  }, [activeCard?.userConceptId]);

  const MinimalEngineLoader = () => (
    <div className="min-h-[380px] flex flex-col items-center justify-center max-w-xl mx-auto px-6 select-none">
      <style>{`
        @keyframes microTrack {
          0% { transform: scaleX(0.15); opacity: 0.2; }
          40% { transform: scaleX(0.85); opacity: 0.8; }
          70% { transform: scaleX(1); opacity: 0.4; }
          100% { transform: scaleX(0.15); opacity: 0.2; }
        }
        @keyframes enginePulse {
          0%, 100% { transform: scale(0.96); opacity: 0.4; }
          50% { transform: scale(1.04); opacity: 1; filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4)); }
        }
        .anim-micro-track { animation: microTrack 2.4s cubic-bezier(0.25, 1, 0.5, 1) infinite; }
        .anim-engine-pulse { animation: enginePulse 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      `}</style>

      <div className="flex flex-col items-center w-full max-w-[200px] gap-5">
        <div className="w-full h-[2px] bg-zinc-800/60 rounded-full relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full origin-center anim-micro-track" />
        </div>
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-blue-500 anim-engine-pulse" />
            <p className="text-[9px] font-mono tracking-[0.25em] text-theme-secondary uppercase">
              Syncing Engine
            </p>
          </div>
          <p className="text-[10px] text-zinc-600 font-sans tracking-wide">
            Calibrating review matrices
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) return <MinimalEngineLoader />;

  if (!concepts || concepts.length === 0) {
    if (!initialCheckDone) return <MinimalEngineLoader />;

    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-6 space-y-4 max-w-sm mx-auto">
        <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            Review Queue Cleared
          </h2>
          <p className="text-xs text-theme-secondary leading-relaxed">
            Your memory baselines are secure. No concept cards are due right now.
          </p>
        </div>
      </div>
    );
  }

  // MODIFIED: State transitions smoothly without executing any scroll overrides
  const handleRevealAnswer = () => {
    setShowAnswer(true);
    /* setTimeout(() => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40); */
  };

  // MODIFIED: State transitions smoothly without executing any scroll overrides
  const handleReturnToQuestion = () => {
    setShowAnswer(false);
    /* setTimeout(() => {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40); */
  };

  const handleRateCard = async (rating) => {
    if (submittingRating || isExiting) return;
    setSubmittingRating(true);

    try {
      await noteService.submitReviewFeedback(activeCard.userConceptId, rating);
      setIsExiting(true);

      setTimeout(() => {
        handleCardReviewed(activeCard.userConceptId);
        setShowAnswer(false);
        setIsExiting(false);

        if (concepts.length === 1) {
          handleSyncData();
          if (onBackToHome) onBackToHome();
        }
      }, 250);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-6 min-h-[350px] max-w-xl mx-auto pb-8 text-theme-primary">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-theme pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-500 flex items-center gap-2">
            <Layers size={18} className="text-blue-500" />
            <span className="text-theme-primary">Recall Active Engine</span>
          </h1>
          <p className="text-xs text-theme-secondary mt-0.5">Active retention tracking loop.</p>
        </div>
        <span className="text-xs font-mono bg-theme-card text-theme-accent font-semibold px-2.5 py-1 rounded-full border border-theme shadow-sm">
          Queue: {concepts.length}
        </span>
      </div>

      {/* Card Container Structure */}
      <div
        className={`w-full transition-all duration-300 ${isExiting ? 'opacity-0 scale-95 blur-[2px]' : 'opacity-100 scale-100'}`}
        style={{ perspective: '1200px' }}
      >
        <div
          key={activeCard?.userConceptId}
          className="relative w-full transition-transform duration-500"
          style={{
            transform: showAnswer ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* FRONT CONTAINER VIEW */}
          <div
            className={`w-full bg-theme-card border border-theme rounded-2xl p-6 flex flex-col justify-start shadow-2xl transition-all duration-300 ${
              showAnswer ? 'pointer-events-none absolute opacity-0 invisible h-0 overflow-hidden' : 'opacity-100 visible h-auto'
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-widest font-mono text-theme-muted uppercase block">Active Inquiry Challenge</span>
              <p className="text-base text-theme-primary leading-relaxed font-medium">{activeCard?.questionText}</p>
            </div>
            <div className="border-t border-zinc-800/40 pt-4 mt-5 w-full">
              <button
                onClick={handleRevealAnswer}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-3 rounded-xl transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10"
              >
                <Eye size={15} /> Reveal Resolution Map
              </button>
            </div>
          </div>

          {/* BACK CONTAINER VIEW */}
          <div
            className={`w-full bg-theme-card border border-theme rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300 ${
              showAnswer ? 'opacity-100 visible h-auto' : 'pointer-events-none absolute opacity-0 invisible h-0 overflow-hidden'
            }`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center bg-zinc-950/30 border border-zinc-800/50 p-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <button onClick={handleReturnToQuestion} className="p-1 text-theme-secondary hover:text-zinc-200 transition-colors">
                    <ArrowLeft size={14} />
                  </button>
                  <span className="text-[10px] font-bold tracking-widest font-mono text-emerald-400 uppercase block">• Verified Answer</span>
                </div>
                <span className={`text-[9px] px-2.5 py-1 rounded-lg font-semibold border tracking-wide uppercase ${
                  activeCard?.difficulty === 'HARD' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  activeCard?.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {activeCard?.difficulty || 'NORMAL'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="bg-zinc-950 p-4 rounded-xl border border-theme">
                  <p className="text-sm text-theme-primary leading-relaxed whitespace-pre-wrap font-mono">{activeCard?.answerText}</p>
                </div>
              </div>

              {activeCard?.keyNotes && (
                <div className="space-y-1.5 bg-theme-card border border-theme p-3 rounded-xl">
                  <span className="text-[10px] font-bold tracking-widest font-mono text-zinc-500 uppercase block">Contextual Key Notes</span>
                  <p className="text-xs text-theme-secondary leading-relaxed italic">{activeCard.keyNotes}</p>
                </div>
              )}
            </div>

            {/* Response Form Selection Grid */}
            <div className="pt-4 border-t border-zinc-800/40 mt-6">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-bold font-mono text-zinc-300 uppercase tracking-[0.2em] block">Rate your recall to advance queue</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <button disabled={submittingRating || isExiting} onClick={() => handleRateCard('HARD')} className="bg-zinc-900 border border-red-500/20 text-red-400 py-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 active:scale-[0.96] disabled:opacity-40">
                    <ShieldAlert size={15} /> <span>Forgot</span>
                  </button>
                  <button disabled={submittingRating || isExiting} onClick={() => handleRateCard('MEDIUM')} className="bg-zinc-900 border border-amber-500/20 text-amber-400 py-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 active:scale-[0.96] disabled:opacity-40">
                    <Frown size={15} /> <span>Hesitant</span>
                  </button>
                  <button disabled={submittingRating || isExiting} onClick={() => handleRateCard('EASY')} className="bg-zinc-900 border border-emerald-500/20 text-emerald-400 py-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 active:scale-[0.96] disabled:opacity-40">
                    <Smile size={15} /> <span>Got It</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}