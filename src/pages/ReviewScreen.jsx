import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Eye, CheckCircle2, ShieldAlert, Smile, Frown, Layers, ArrowLeft } from 'lucide-react';
import { noteService } from '../api/noteService';
import { useReviewEngine } from '../context/ReviewContext';
import StatusCapsule from '../components/StatusCapsule';

export default function ReviewScreen({ onBackToHome }) {
  const { 
    reviewConcepts: concepts, 
    isConceptsLoading: loading, 
    handleCardReviewed 
  } = useReviewEngine();

  const [showAnswer, setShowAnswer] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  // Local state to manage the rating capsule notifications
  const [reviewStatus, setReviewStatus] = useState(null);

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

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const handleReturnToQuestion = () => {
    setShowAnswer(false);
  };

  const handleRateCard = async (rating) => {
    if (submittingRating || isExiting) return;
    setSubmittingRating(true);

    let messageText = "Concept Saved";
    let capsuleType = "success";

    if (rating === "HARD") {
      messageText = "Review Scheduled Soon";
      capsuleType = "error"; 
    } else if (rating === "MEDIUM") {
      messageText = "Interval Updated";
      capsuleType = "warn"; 
    } else if (rating === "EASY") {
      messageText = "Retention Locked";
      capsuleType = "success"; 
    }

    try {
      setReviewStatus({ text: messageText, type: capsuleType });

      await noteService.submitReviewFeedback(activeCard.userConceptId, rating);
      setIsExiting(true);

      // 1. Snappy card transition
      setTimeout(() => {
        handleCardReviewed(activeCard.userConceptId);
        setShowAnswer(false);
        setIsExiting(false);
      }, 250);

      // 2. Longer capsule visibility
      setTimeout(() => {
        setReviewStatus(null);
      }, 2000);

    } catch (err) {
      console.error(err);
      setReviewStatus({ text: "Sync Failed", type: "warn" });
      setTimeout(() => setReviewStatus(null), 1500);
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <>
      {/* PERSISTENT PORTAL: We always render the Portal. StatusCapsule handles its own visibility. */}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed top-6 right-6 z-[9999] pointer-events-none flex justify-end">
          <StatusCapsule 
            message={reviewStatus} 
            type={reviewStatus?.type || 'success'} 
          />
        </div>,
        document.body
      )}

      <div ref={containerRef} className="space-y-6 min-h-[350px] max-w-xl mx-auto pb-8 text-theme-primary select-none">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-400 flex items-center gap-2">
              <Layers size={16} className="text-blue-500/80 stroke-[2]" />
              <span className="text-zinc-200">Recall Active Engine</span>
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Active retention tracking loop.</p>
          </div>
          <span className="text-xs font-mono bg-zinc-900/50 text-zinc-400 font-medium px-2.5 py-1 rounded-full border border-zinc-800 shadow-sm">
            Queue: {concepts.length}
          </span>
        </div>

        {/* Card Container Structure */}
        <div
          className={`w-full transition-all duration-300 ${isExiting ? 'opacity-0 scale-98 blur-[1px]' : 'opacity-100 scale-100'}`}
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
              className={`w-full bg-theme-card border border-zinc-900/80 rounded-2xl p-6 flex flex-col justify-start shadow-xl transition-all duration-300 ${
                showAnswer ? 'pointer-events-none absolute opacity-0 invisible h-0 overflow-hidden' : 'opacity-100 visible h-auto'
              }`}
            >
              {/* Question Text Area */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-[0.15em] font-mono text-zinc-500 uppercase block">Active Inquiry Challenge</span>
                <p className="text-[15px] text-zinc-100 leading-relaxed font-normal tracking-wide min-h-[60px]">
                  {activeCard?.questionText}
                </p>
              </div>
              
              {/* Calm, Deep Dark Reveal Trigger */}
              <div className="border-t border-zinc-900 pt-5 mt-6 w-full">
                <button
                  onClick={handleRevealAnswer}
                  className="w-full bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 font-medium text-xs py-3 rounded-xl transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 tracking-wide shadow-sm"
                >
                  <Eye size={14} className="opacity-70 stroke-[2]" /> 
                  <span>Reveal Resolution Map</span>
                </button>
              </div>
            </div>

            {/* BACK CONTAINER VIEW */}
            <div
              className={`w-full bg-theme-card border border-zinc-900/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300 ${
                showAnswer ? 'opacity-100 visible h-auto' : 'pointer-events-none absolute opacity-0 invisible h-0 overflow-hidden'
              }`}
              style={{ transform: 'rotateY(180deg)' }}
            >
              <div className="space-y-5 flex-1">
                {/* Meta Header */}
                <div className="flex justify-between items-center bg-zinc-950/20 border border-zinc-900/60 p-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    <button onClick={handleReturnToQuestion} className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                      <ArrowLeft size={14} />
                    </button>
                    <span className="text-[10px] font-bold tracking-widest font-mono text-zinc-400 uppercase block">• Verified Answer</span>
                  </div>
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-lg font-medium border tracking-wide font-mono uppercase ${
                    activeCard?.difficulty === 'HARD' ? 'bg-red-500/5 text-red-400/90 border-red-500/10' :
                    activeCard?.difficulty === 'MEDIUM' ? 'bg-amber-500/5 text-amber-400/90 border-amber-500/10' :
                    'bg-emerald-500/5 text-emerald-400/90 border-emerald-500/10'
                  }`}>
                    {activeCard?.difficulty || 'NORMAL'}
                  </span>
                </div>

                {/* Premium Calm Answer Block (Optimized Typography Structure) */}
                <div className="pt-2 px-1 min-h-[100px]">
                  <p className="text-[15px] text-zinc-200 leading-relaxed font-normal tracking-wide whitespace-pre-wrap font-sans">
                    {activeCard?.answerText}
                  </p>
                </div>

                {activeCard?.keyNotes && (
                  <div className="space-y-1.5 pt-4 border-t border-zinc-900/40">
                    <span className="text-[9px] font-bold tracking-widest font-mono text-zinc-500 uppercase block">Contextual Key Notes</span>
                    <p className="text-xs text-zinc-400 leading-relaxed italic font-sans">{activeCard.keyNotes}</p>
                  </div>
                )}
              </div>

              {/* Response Form Selection Grid */}
              <div className="pt-4 border-t border-zinc-900/60 mt-6">
                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold font-mono text-zinc-400 uppercase tracking-wider block">
                      Rate your recall to advance queue
                    </span>
                    <span className="text-[10px] text-zinc-500 block leading-relaxed">
                      Your selection recalibrates the spaced repetition schedule.
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2.5">
                    <button 
                      disabled={submittingRating || isExiting} 
                      onClick={() => handleRateCard('HARD')} 
                      className="bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800 hover:border-red-900/40 text-zinc-400 hover:text-red-400 py-3 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition-all duration-150 active:scale-[0.96] disabled:opacity-40"
                    >
                      <ShieldAlert size={15} className="text-red-500/70" /> 
                      <span className="font-medium tracking-wide">Forgot</span>
                    </button>
                    
                    <button 
                      disabled={submittingRating || isExiting} 
                      onClick={() => handleRateCard('MEDIUM')} 
                      className="bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-900/40 text-zinc-400 hover:text-amber-400 py-3 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition-all duration-150 active:scale-[0.96] disabled:opacity-40"
                    >
                      <Frown size={15} className="text-amber-500/70" /> 
                      <span className="font-medium tracking-wide">Hesitant</span>
                    </button>
                    
                    <button 
                      disabled={submittingRating || isExiting} 
                      onClick={() => handleRateCard('EASY')} 
                      className="bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-900/40 text-zinc-400 hover:text-emerald-400 py-3 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition-all duration-150 active:scale-[0.96] disabled:opacity-40"
                    >
                      <Smile size={15} className="text-emerald-500/70" /> 
                      <span className="font-medium tracking-wide">Got It</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}