import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  CheckCircle2,
  ShieldAlert,
  Smile,
  Frown,
  Layers,
  ArrowLeft,
} from 'lucide-react';

import { noteService } from '../api/noteService';

export default function ReviewScreen({
  concepts = [],
  loading,
  onSyncNeeded,
  onCardReviewed,
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const headerRef = useRef(null);

  const activeCard = concepts[0];

  // Monitor network activity to determine if the initial data fetch cycle has completed
  useEffect(() => {
    if (loading || concepts.length > 0) {
      setInitialCheckDone(true);
    } else {
      // Small debounce fallback: if no loading starts within 180ms, assume the queue is genuinely empty
      const timer = setTimeout(() => {
        setInitialCheckDone(true);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [loading, concepts.length]);

  useEffect(() => {
    if (activeCard && headerRef.current) {
      headerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [concepts[0]?.userConceptId]);

  // Premium Minimal Micro-Node Tracking Loader
  const MinimalEngineLoader = () => (
    <div className="min-h-[380px] flex flex-col items-center justify-center max-w-xl mx-auto px-6 select-none">
      {/* High-Fidelity Sub-Pixel Keyframes */}
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
        .anim-micro-track { 
          animation: microTrack 2.4s cubic-bezier(0.25, 1, 0.5, 1) infinite; 
        }
        .anim-engine-pulse { 
          animation: enginePulse 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; 
        }
      `}</style>

      <div className="flex flex-col items-center w-full max-w-[200px] gap-5">
        {/* Sleek Minimal Precision Gauge Line */}
        <div className="w-full h-[2px] bg-zinc-800/60 rounded-full relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full origin-center anim-micro-track" />
        </div>
        
        {/* Monospace Indicator Typography */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-blue-500 anim-engine-pulse" />
            <p className="text-[9px] font-mono tracking-[0.25em] text-zinc-400 uppercase">
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

  if (loading) {
    return <MinimalEngineLoader />;
  }

  if (!concepts || concepts.length === 0) {
    if (!initialCheckDone) {
      return <MinimalEngineLoader />;
    }

    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-6 space-y-4 max-w-sm mx-auto">
        <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-110">
            Review Queue Cleared
          </h2>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Your memory baselines are secure. No concept cards are due right now.
          </p>
        </div>
      </div>
    );
  }

  const handleRevealAnswer = () => {
    setShowAnswer(true);

    setTimeout(() => {
      headerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 40);
  };

  const handleReturnToQuestion = () => {
    setShowAnswer(false);

    setTimeout(() => {
      headerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 40);
  };

  const handleRateCard = async (rating) => {
    if (submittingRating || isExiting) return;

    setSubmittingRating(true);

    try {
      await noteService.submitReviewFeedback(
        activeCard.userConceptId,
        rating
      );

      setIsExiting(true);

      setTimeout(() => {
        onCardReviewed(activeCard.userConceptId);

        setShowAnswer(false);
        setIsExiting(false);

        if (concepts.length === 1) {
          onSyncNeeded();
        }
      }, 250);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="space-y-6 min-h-[350px] max-w-xl mx-auto pb-8">

      {/* Header */}
            <div headerRef={headerRef} className="flex justify-between items-start border-b border-zinc-800/60 pb-4">

        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-500 flex items-center gap-2">
            <Layers size={18} className="text-blue-500" />
            <span className="text-zinc-100">
              Recall Active Engine
            </span>
          </h1>

          <p className="text-xs text-zinc-400 mt-0.5">
            Active retention tracking loop.
          </p>
        </div>

        <span className="text-xs font-mono bg-zinc-900/50 text-blue-400 font-semibold px-2.5 py-1 rounded-full border border-zinc-800 shadow-sm">
          Queue: {concepts.length}
        </span>
      </div>

      {/* Card Container */}
      <div
        className={`w-full transition-all duration-300 ${isExiting
            ? 'opacity-0 scale-95 blur-[2px]'
            : 'opacity-100 scale-100'
          }`}
        style={{ perspective: '1200px' }}
      >
        <div
          key={activeCard?.userConceptId}
          className="relative w-full transition-transform duration-500"
          style={{
            transform: showAnswer
              ? 'rotateY(180deg)'
              : 'rotateY(0deg)',
            transformStyle: 'preserve-3d',
          }}
        >

          {/* FRONT */}
          <div
            className={`w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-start shadow-2xl transition-all duration-300 ${showAnswer
                ? 'pointer-events-none absolute opacity-0 invisible h-0 overflow-hidden'
                : 'opacity-100 visible h-auto'
              }`}
            style={{ backfaceVisibility: 'hidden' }}
          >

            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-widest font-mono text-zinc-500 uppercase block">
                Active Inquiry Challenge
              </span>

              <p className="text-base text-zinc-100 leading-relaxed font-medium">
                {activeCard?.questionText}
              </p>
            </div>

            <div className="border-t border-zinc-800/40 pt-4 mt-5 w-full">
              <button
                onClick={handleRevealAnswer}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-3 rounded-xl transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 hover:shadow-blue-500/20"
              >
                <Eye size={15} />
                Reveal Resolution Map
              </button>
            </div>
          </div>

          {/* BACK */}
          <div
            className={`w-full bg-zinc-900/60 border border-emerald-500/10 rounded-2xl p-6 flex flex-col justify-between shadow-2xl shadow-emerald-950/5 transition-all duration-300 ${showAnswer
                ? 'opacity-100 visible h-auto'
                : 'pointer-events-none absolute opacity-0 invisible h-0 overflow-hidden'
              }`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >

            <div className="space-y-4 flex-1">

              {/* Top */}
              <div className="flex justify-between items-center bg-zinc-950/30 border border-zinc-800/50 p-2 rounded-xl">
                <div className="flex items-center gap-2">

                  <button
                    onClick={handleReturnToQuestion}
                    className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                    title="Return to Question"
                  >
                    <ArrowLeft size={14} />
                  </button>

                  <span className="text-[10px] font-bold tracking-widest font-mono text-emerald-400 uppercase block">
                    • Verified Answer
                  </span>
                </div>

                <span
                  className={`text-[9px] px-2.5 py-1 rounded-lg font-semibold border tracking-wide uppercase shadow-sm ${activeCard?.difficulty === 'HARD'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : activeCard?.difficulty === 'MEDIUM'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                >
                  {activeCard?.difficulty || 'NORMAL'}
                </span>
              </div>

              {/* Answer */}
              <div className="space-y-2">
                <div className="bg-zinc-950/90 p-4 rounded-xl border border-zinc-800 shadow-inner">
                  <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap font-mono">
                    {activeCard?.answerText}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {activeCard?.keyNotes && (
                <div className="space-y-1.5 bg-zinc-800/10 border border-zinc-800/30 p-3 rounded-xl">
                  <span className="text-[10px] font-bold tracking-widest font-mono text-zinc-500 uppercase block">
                    Contextual Key Notes
                  </span>

                  <p className="text-xs text-zinc-400 leading-relaxed italic">
                    {activeCard.keyNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Rating Section */}
            <div className="pt-4 border-t border-zinc-800/40 mt-6">

              <div className="space-y-4">

                {/* Instruction */}
                <div className="text-center space-y-2">

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold font-mono text-zinc-300 uppercase tracking-[0.2em] block">
                      Rate your recall to advance queue
                    </span>

                    <span className="text-[10px] text-zinc-500 block leading-relaxed">
                      Your selection recalibrates the spaced repetition schedule.
                    </span>
                  </div>

                  {/* Animated Cue */}
                  <div className="flex justify-center pt-0.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-zinc-500 animate-bounce"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-3 gap-2.5">

                  <button
                    disabled={submittingRating || isExiting}
                    onClick={() => handleRateCard('HARD')}
                    className="bg-zinc-900 border border-red-500/20 hover:border-red-500/40 text-red-400 py-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition-all active:scale-[0.96] disabled:opacity-40 hover:bg-red-500/5 shadow-md"
                  >
                    <ShieldAlert size={15} />
                    <span>Forgot</span>
                  </button>

                  <button
                    disabled={submittingRating || isExiting}
                    onClick={() => handleRateCard('MEDIUM')}
                    className="bg-zinc-900 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 py-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition-all active:scale-[0.96] disabled:opacity-40 hover:bg-amber-500/5 shadow-md"
                  >
                    <Frown size={15} />
                    <span>Hesitant</span>
                  </button>

                  <button
                    disabled={submittingRating || isExiting}
                    onClick={() => handleRateCard('EASY')}
                    className="bg-zinc-900 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 py-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition-all active:scale-[0.96] disabled:opacity-40 hover:bg-emerald-500/5 shadow-md"
                  >
                    <Smile size={15} />
                    <span>Got It</span>
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