import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Eye, CheckCircle2, ShieldAlert, Smile, Frown, Layers, ArrowLeft, X, HelpCircle } from 'lucide-react';
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
  const [showFSRSModal, setShowFSRSModal] = useState(false);

  // Local state to manage the rating capsule notifications
  const [reviewStatus, setReviewStatus] = useState(null);

  // Rewards Engine State for global coordinate tracking with multi-particle bursts
  const [rewardTrack, setRewardTrack] = useState({ x: 0, y: 0, color: '', glow: '', active: false });

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

  const handleRateCard = async (rating, e) => {
    if (submittingRating || isExiting) return;

    if (e && e.clientX && e.clientY) {
      let coreColor = '#3b82f6'; 
      let glowColor = 'rgba(59, 130, 246, 0.45)';
      
      if (rating === "AGAIN") {
        coreColor = '#ef4444'; 
        glowColor = 'rgba(239, 68, 68, 0.5)';
      } else if (rating === "HARD") {
        coreColor = '#f97316'; 
        glowColor = 'rgba(249, 115, 22, 0.5)';
      } else if (rating === "EASY") {
        coreColor = '#10b981'; 
        glowColor = 'rgba(16, 185, 129, 0.6)';
      }

      setRewardTrack({
        x: e.clientX,
        y: e.clientY,
        color: coreColor,
        glow: glowColor,
        active: true
      });
    }

    setSubmittingRating(true);

    let messageText = "Concept Saved";
    let capsuleType = "success";

    if (rating === "AGAIN") {
      messageText = "Lapse Handled • Reviewing Soon";
      capsuleType = "error";
    } else if (rating === "HARD") {
      messageText = "Struggled • Core Trace Maintained";
      capsuleType = "warn";
    } else if (rating === "GOOD") {
      messageText = "Interval Updated Successfully";
      capsuleType = "success";
    } else if (rating === "EASY") {
      messageText = "Retention Extended Safely";
      capsuleType = "success";
    }

    try {
      setReviewStatus({ text: messageText, type: capsuleType });

      await noteService.submitReviewFeedback(activeCard.userConceptId, rating);
      setIsExiting(true);

      setTimeout(() => {
        handleCardReviewed(activeCard.userConceptId);
        setShowAnswer(false);
        setIsExiting(false);
        setRewardTrack(prev => ({ ...prev, active: false }));
      }, 250);

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
      {typeof document !== 'undefined' && createPortal(
        <>
          <style>{`
            @keyframes shockwave-halo {
              0% { transform: translate(-50%, -50%) scale(0.1); opacity: 1; filter: blur(0px); border-width: 3px; }
              40% { opacity: 0.8; }
              100% { transform: translate(-50%, -50%) scale(3.2); opacity: 0; filter: blur(4px); border-width: 1px; }
            }
            @keyframes particle-blast-1 { 0% { transform: translate(-50%, -50%) translate(0, 0) scale(1.3) rotate(0deg); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(-45px, -35px) scale(0) rotate(180deg); opacity: 0; } }
            @keyframes particle-blast-2 { 0% { transform: translate(-50%, -50%) translate(0, 0) scale(1) rotate(0deg); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(52px, -25px) scale(0) rotate(-120deg); opacity: 0; } }
            @keyframes particle-blast-3 { 0% { transform: translate(-50%, -50%) translate(0, 0) scale(1.5) rotate(0deg); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(-22px, 48px) scale(0) rotate(240deg); opacity: 0; } }
            @keyframes particle-blast-4 { 0% { transform: translate(-50%, -50%) translate(0, 0) scale(1.1) rotate(0deg); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(38px, 42px) scale(0) rotate(-200deg); opacity: 0; } }
            @keyframes particle-blast-5 { 0% { transform: translate(-50%, -50%) translate(0, 0) scale(1.4) rotate(0deg); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(-55px, 10px) scale(0) rotate(90deg); opacity: 0; } }
            @keyframes particle-blast-6 { 0% { transform: translate(-50%, -50%) translate(0, 0) scale(0.9) rotate(0deg); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(58px, 15px) scale(0) rotate(-90deg); opacity: 0; } }
            @keyframes particle-blast-7 { 0% { transform: translate(-50%, -50%) translate(0, 0) scale(1.2) rotate(0deg); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(5px, -55px) scale(0) rotate(320deg); opacity: 0; } }
            @keyframes particle-blast-8 { 0% { transform: translate(-50%, -50%) translate(0, 0) scale(1) rotate(0deg); opacity: 1; } 100% { transform: translate(-50%, -50%) translate(-10px, -50px) scale(0) rotate(-45deg); opacity: 0; } }
            
            .dopamine-halo { animation: shockwave-halo 600ms cubic-bezier(0.15, 0.85, 0.35, 1) forwards; }
            .dp-1 { animation: particle-blast-1 550ms cubic-bezier(0.1, 0.8, 0.25, 1) forwards; }
            .dp-2 { animation: particle-blast-2 520ms cubic-bezier(0.1, 0.8, 0.25, 1) forwards; }
            .dp-3 { animation: particle-blast-3 580ms cubic-bezier(0.1, 0.8, 0.25, 1) forwards; }
            .dp-4 { animation: particle-blast-4 500ms cubic-bezier(0.1, 0.8, 0.25, 1) forwards; }
            .dp-5 { animation: particle-blast-5 530ms cubic-bezier(0.1, 0.8, 0.25, 1) forwards; }
            .dp-6 { animation: particle-blast-6 490ms cubic-bezier(0.1, 0.8, 0.25, 1) forwards; }
            .dp-7 { animation: particle-blast-7 560ms cubic-bezier(0.1, 0.8, 0.25, 1) forwards; }
            .dp-8 { animation: particle-blast-8 540ms cubic-bezier(0.1, 0.8, 0.25, 1) forwards; }
          `}</style>

          {rewardTrack.active && (
            <div 
              className="fixed pointer-events-none z-[10000]"
              style={{ left: rewardTrack.x, top: rewardTrack.y }}
            >
              <div 
                className="dopamine-halo absolute w-12 h-12 rounded-full border-4" 
                style={{ borderColor: rewardTrack.color, boxShadow: `0 0 16px ${rewardTrack.glow}` }}
              />
              <div className="dp-1 absolute w-2.5 h-2.5 bg-white rounded-sm rotate-45" style={{ boxShadow: `0 0 8px ${rewardTrack.color}` }} />
              <div className="dp-2 absolute w-2 h-2 rounded-full" style={{ backgroundColor: rewardTrack.color }} />
              <div className="dp-3 absolute w-3 h-1.5 rounded-full" style={{ backgroundColor: rewardTrack.color }} />
              <div className="dp-4 absolute w-2 h-2 bg-white rounded-full" style={{ boxShadow: `0 0 6px ${rewardTrack.color}` }} />
              <div className="dp-5 absolute w-1.5 h-3 bg-white rounded-sm" />
              <div className="dp-6 absolute w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rewardTrack.color }} />
              <div className="dp-7 absolute w-2 h-2 bg-white rotate-12" style={{ boxShadow: `0 0 10px ${rewardTrack.color}` }} />
              <div className="dp-8 absolute w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rewardTrack.color }} />
            </div>
          )}

          {/* FSRS Calibration Guidance Modal */}
          {showFSRSModal && (
            <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in-95 ease-out duration-200">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <HelpCircle size={15} className="text-blue-400" />
                    <h3 className="text-xs font-semibold text-zinc-200 font-mono tracking-wide uppercase">How to rate your recall</h3>
                  </div>
                  <button 
                    onClick={() => setShowFSRSModal(false)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
                  >
                    <X size={15} />
                  </button>
                </div>
                
                <div className="p-4 space-y-3.5 text-xs">
                  <p className="text-zinc-400 leading-relaxed">
                    Be honest with yourself! Pick the option that matches how hard your brain had to work to find the answer:
                  </p>

                  <div className="space-y-2.5">
                    <div className="flex gap-3 items-start bg-zinc-950/20 p-2.5 rounded-xl border border-zinc-800/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-zinc-200">Blank (Again): </span>
                        <span className="text-zinc-400">You completely forgot, drew a blank, or got it wrong. This card will show up again very soon.</span>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start bg-zinc-950/20 p-2.5 rounded-xl border border-zinc-800/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-zinc-200">Barely (Hard): </span>
                        <span className="text-zinc-400">You remembered it, but it took serious effort, hesitation, or a long pause. You'll see it a bit sooner.</span>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start bg-zinc-950/20 p-2.5 rounded-xl border border-zinc-800/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-zinc-200">Right (Good): </span>
                        <span className="text-zinc-400">Normal, successful recall. You remembered it with just a brief thought. This is the sweet spot.</span>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start bg-zinc-950/20 p-2.5 rounded-xl border border-zinc-800/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-zinc-200">Too Easy: </span>
                        <span className="text-zinc-400">Instant pop in your head with zero effort. The system pushes this card far into the future.</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-500 bg-zinc-950/40 p-2 rounded-lg text-center font-mono border border-zinc-800/30">
                    Rule of thumb: When in doubt, click "Right".
                  </p>
                </div>
              </div>
            </div>
          )}
        </>,
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
              className={`w-full bg-theme-card border border-zinc-900/80 rounded-2xl p-6 flex flex-col justify-start shadow-xl transition-all duration-300 ${showAnswer ? 'pointer-events-none absolute opacity-0 invisible h-0 overflow-hidden' : 'opacity-100 visible h-auto'
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
              className={`w-full bg-theme-card border border-zinc-900/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300 ${showAnswer ? 'opacity-100 visible h-auto' : 'pointer-events-none absolute opacity-0 invisible h-0 overflow-hidden'
                }`}
              style={{ transform: 'rotateY(180deg)' }}
            >
              <div className="space-y-5 flex-1">
                {/* Meta Header */}
               <div className="flex justify-between items-center bg-zinc-950/20 border border-zinc-900/60 p-2 rounded-xl">
  <div className="flex items-center gap-2">
    <button
      onClick={handleReturnToQuestion}
      className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
    >
      <ArrowLeft size={14} />
    </button>

    <span className="text-[10px] font-bold tracking-widest font-mono text-zinc-400 uppercase block">
      Verified Answer
    </span>
  </div>

  <HelpCircle
    onClick={() => setShowFSRSModal(true)}
    size={10}
    className="text-zinc-500 stroke-[2.5]"
  />
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
                <div className="space-y-3">

                  {/* Minimalist, functional header header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold font-mono text-zinc-500 uppercase tracking-wider block">
                      Rate Recall & Adjust Intervals
                    </span>
                    <button 
                      className="text-[9px] font-mono text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-800/80 transition-all duration-150 flex items-center gap-1 active:scale-[0.98]"
                    >
                      <span>FSRS Engine v5.0</span>
                    </button>
                  </div>

                  {/* Premium balanced 4-column custom response engine matrix */}
                  <div className="grid grid-cols-4 gap-2">

                    {/* AGAIN BUTTON */}
                    <button
                      disabled={submittingRating || isExiting}
                      onClick={(e) => handleRateCard('AGAIN', e)}
                      className="bg-zinc-900/20 hover:bg-zinc-900 border border-zinc-800/80 hover:border-red-900/40 text-zinc-500 hover:text-red-400 py-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all duration-150 active:scale-[0.96] disabled:opacity-40"
                    >
                      <ShieldAlert size={13} className="text-red-500/50 hover:text-red-500" />
                      <span className="text-xs font-semibold tracking-wide">Blank</span>
                      <span className="text-[9px] font-mono text-red-500/70 font-medium mt-0.5 bg-red-950/20 border border-red-900/20 px-1 rounded">
                        Restart
                      </span>
                    </button>

                    {/* HARD BUTTON */}
                    <button
                      disabled={submittingRating || isExiting}
                      onClick={(e) => handleRateCard('HARD', e)}
                      className="bg-zinc-900/20 hover:bg-zinc-900 border border-zinc-800/80 hover:border-orange-900/40 text-zinc-500 hover:text-orange-400 py-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all duration-150 active:scale-[0.96] disabled:opacity-40"
                    >
                      <Frown size={13} className="text-orange-500/50 hover:text-orange-500" />
                      <span className="text-xs font-semibold tracking-wide">Barely</span>
                      <span className="text-[9px] font-mono text-orange-400/70 font-medium mt-0.5 bg-orange-950/20 border border-orange-900/20 px-1 rounded">
                        Shorter
                      </span>
                    </button>

                    {/* GOOD BUTTON */}
                    <button
                      disabled={submittingRating || isExiting}
                      onClick={(e) => handleRateCard('GOOD', e)}
                      className="bg-zinc-900/20 hover:bg-zinc-900 border border-zinc-800/80 hover:border-blue-900/40 text-zinc-500 hover:text-blue-400 py-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all duration-150 active:scale-[0.96] disabled:opacity-40"
                    >
                      <Smile size={13} className="text-blue-500/50 hover:text-blue-500" />
                      <span className="text-xs font-semibold tracking-wide">Right</span>
                      <span className="text-[9px] font-mono text-blue-400/70 font-medium mt-0.5 bg-blue-950/20 border border-blue-900/20 px-1 rounded">
                        Standard
                      </span>
                    </button>

                    {/* EASY BUTTON */}
                    <button
                      disabled={submittingRating || isExiting}
                      onClick={(e) => handleRateCard('EASY', e)}
                      className="bg-zinc-900/20 hover:bg-zinc-900 border border-zinc-800/80 hover:border-emerald-900/40 text-zinc-400 hover:text-emerald-400 py-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all duration-150 active:scale-[0.96] disabled:opacity-40"
                    >
                      <CheckCircle2 size={13} className="text-emerald-500/50 hover:text-emerald-500" />
                      <span className="text-xs font-semibold tracking-wide whitespace-nowrap">Too Easy</span>
                      <span className="text-[9px] font-mono text-emerald-400/70 font-medium mt-0.5 bg-emerald-950/20 border border-emerald-900/20 px-1 rounded">
                        Fast {">>"}
                      </span>
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