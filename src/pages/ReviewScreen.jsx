import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ShieldAlert, Smile, Frown, Layers, X, HelpCircle, ArrowRight } from 'lucide-react';
import { noteService } from '../api/noteService';
import { useReviewEngine } from '../context/ReviewContext';

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
  const [reviewStatus, setReviewStatus] = useState(null);
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
        <div className="w-full h-[2px] bg-zinc-200 dark:bg-zinc-800/60 rounded-full relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full origin-center anim-micro-track" />
        </div>
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-blue-500 anim-engine-pulse" />
            <p className="text-s1 font-mono tracking-[0.25em] text-zinc-600 dark:text-zinc-400 uppercase">
              Syncing Engine
            </p>
          </div>
          <p className="text-s1 text-zinc-500 dark:text-zinc-600 font-sans tracking-wide">
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
          <CheckCircle2 size={32} className="text-emerald-500 dark:text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-s5 font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Review Queue Cleared
          </h2>
          <p className="text-s2 text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Your memory baselines are secure. No concept cards are due right now.
          </p>
        </div>
      </div>
    );
  }

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
      setShowAnswer(true);

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

  const handleNextCard = () => {
    if (isExiting) return;
    setIsExiting(true);

    setTimeout(() => {
      handleCardReviewed(activeCard.userConceptId);
      setShowAnswer(false);
      setIsExiting(false);
      setRewardTrack(prev => ({ ...prev, active: false }));
    }, 250);
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

          {/* FSRS Guidance Modal */}
        {showFSRSModal && (
  <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in-95 ease-out duration-200">
      
      {/* HEADER */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <HelpCircle size={15} className="text-blue-500 dark:text-blue-400" />
          <h3 className="text-s2 font-semibold text-zinc-800 dark:text-zinc-200 font-mono tracking-wide uppercase">
            How to rate your recall
          </h3>
        </div>
        <button
          onClick={() => setShowFSRSModal(false)}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all"
        >
          <X size={15} />
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-4 text-s3">
        
        {/* METRICS STACK */}
        <div className="space-y-2">
          
          {/* AGAIN */}
          <div className="flex gap-3 items-start bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Forgot: </span>
              You could not recall what the concept was about. The concept felt completely unfamiliar.
            </p>
          </div>

          {/* HARD */}
          <div className="flex gap-3 items-start bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Partial: </span>
              You recognized the concept and remembered something about it, but the details were mostly missing.
            </p>
          </div>

          {/* GOOD */}
          <div className="flex gap-3 items-start bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Recalled: </span>
              You recalled the main idea correctly and could explain at least one or two important points.
            </p>
          </div>

          {/* EASY */}
          <div className="flex gap-3 items-start bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Fluent: </span>
              You recalled the concept immediately and remembered most of the important details without effort.
            </p>
          </div>

        </div>

        {/* FOOTNOTE */}
        <p className="text-s2 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl text-justify font-mono border border-zinc-200 dark:border-zinc-800/30 leading-relaxed">
          There is no perfect rating. Choose the option that feels closest to your actual recall. Be honest rather than optimistic or pessimistic. The engine works best when ratings reflect what you truly remembered before seeing the answer.
        </p>
      </div>

    </div>
  </div>
)}
        </>,
        document.body
      )}

      <div ref={containerRef} className="space-y-6 min-h-[350px] max-w-xl mx-auto pb-8 text-zinc-800 dark:text-zinc-100 select-none">

        {/* Header */}
        <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-900 pb-4">
          <div>
            <h1 className="text-s5 font-semibold tracking-tight text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Layers size={16} className="text-blue-500 stroke-[2]" />
              <span className="text-zinc-800 dark:text-zinc-200">Recall Active Engine</span>
            </h1>
            <p className="text-s1 text-zinc-400 dark:text-zinc-500 mt-0.5">Active retention tracking loop.</p>
          </div>
          <span className="text-s2 font-mono bg-zinc-100 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 font-medium px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
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
              className={`w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900/80 rounded-2xl p-6 flex flex-col justify-start shadow-xl transition-all duration-300`}
              style={{
                backfaceVisibility: 'hidden',
                position: showAnswer ? 'absolute' : 'relative',
                visibility: showAnswer ? 'hidden' : 'visible'
              }}
            >
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-900/60 p-2 rounded-xl mb-5">
                <span className="text-s1 font-bold tracking-[0.15em] font-mono text-zinc-400 dark:text-zinc-500 uppercase block">
                  Active Inquiry Challenge
                </span>
                <HelpCircle
                  onClick={() => setShowFSRSModal(true)}
                  size={14}
                  className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-400 cursor-pointer stroke-[2.5]"
                />
              </div>

              {/* Question Block */}
              <div className="bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-900/40 rounded-xl p-5 min-h-[110px] flex items-center">
                <p className="text-s4 text-zinc-800 dark:text-zinc-400 leading-relaxed font-medium tracking-wide w-full">
                  {activeCard?.questionText}
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900/60 mt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-s1 font-semibold font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Rate Your Recall To Reveal
                    </span>
                    <div className="text-s0 font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800/80 flex items-center gap-1">
                      <span>FSRS Engine v5.0</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {/* AGAIN BUTTON */}
                    <button
                      disabled={submittingRating || isExiting}
                      onClick={(e) => handleRateCard('FORGOT', e)}
                      className="bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/20 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:border-red-200 dark:hover:border-red-900/40 text-zinc-300 hover:text-red-600 dark:hover:text-red-400 py-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all duration-150 active:scale-[0.96] disabled:opacity-40"
                    >
                      <ShieldAlert size={13} className="text-red-500/60" />
                      <span className="text-s1 font-semibold tracking-wide">Forget</span>
                      <span className="text-s1 font-mono text-red-600 dark:text-red-500/70 font-medium mt-0.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/20 px-1 rounded">
                        Restart
                      </span>
                    </button>

                    {/* HARD BUTTON */}
                    <button
                      disabled={submittingRating || isExiting}
                      onClick={(e) => handleRateCard('PARTIAL', e)}
                      className="bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/20 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:border-orange-200 dark:hover:border-orange-900/40 text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 py-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all duration-150 active:scale-[0.96] disabled:opacity-40"
                    >
                      <Frown size={13} className="text-orange-500/60" />
                      <span className="text-s1 font-semibold tracking-wide">Partial</span>
                      <span className="text-s1 font-mono text-orange-600 dark:text-orange-400/70 font-medium mt-0.5 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/20 px-1 rounded">
                        Shorter
                      </span>
                    </button>

                    {/* GOOD BUTTON */}
                    <button
                      disabled={submittingRating || isExiting}
                      onClick={(e) => handleRateCard('RECALLED', e)}
                      className="bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/20 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:border-blue-200 dark:hover:border-blue-900/40 text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 py-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all duration-150 active:scale-[0.96] disabled:opacity-40"
                    >
                      <Smile size={13} className="text-blue-500/60" />
                      <span className="text-s1 font-semibold tracking-wide">Recalled</span>
                      <span className="text-s1 font-mono text-blue-600 dark:text-blue-400/70 font-medium mt-0.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/20 px-1 rounded">
                        Standard
                      </span>
                    </button>

                    {/* EASY BUTTON */}
                    <button
                      disabled={submittingRating || isExiting}
                      onClick={(e) => handleRateCard('FLUENT', e)}
                      className="bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/20 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-200 dark:hover:border-emerald-900/40 text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 py-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all duration-150 active:scale-[0.96] disabled:opacity-40"
                    >
                      <CheckCircle2 size={13} className="text-emerald-500/60" />
                      <span className="text-s1 font-semibold tracking-wide whitespace-nowrap">Fluent</span>
                      <span className="text-s1 font-mono text-emerald-600 dark:text-emerald-400/70 font-medium mt-0.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/20 px-1 rounded">
                        Fast {">>"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BACK CONTAINER VIEW */}
            <div
              className={`w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900/80 rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300`}
              style={{
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
                position: showAnswer ? 'relative' : 'absolute',
                visibility: showAnswer ? 'visible' : 'hidden'
              }}
            >
              <div className="space-y-5 flex-1">
                <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-900/60 p-2 rounded-xl">
                  <span className="text-s1 font-bold tracking-widest font-mono text-zinc-500 uppercase block">
                    Verified Answer Map
                  </span>
                </div>

                {/* Answer Container Block */}
                <div className="bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20 rounded-xl p-5 min-h-[110px]">
                  <p className="text-s3 text-zinc-800 dark:text-zinc-400 leading-relaxed font-normal tracking-wide whitespace-pre-wrap font-sans">
                    {activeCard?.answerText}
                  </p>
                </div>

                {activeCard?.keyNotes && (
                  <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-900/40">
                    <span className="text-s1 font-bold tracking-widest font-mono text-zinc-400 dark:text-zinc-500 uppercase block">
                      Contextual Key Notes
                    </span>
                    <div className="bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-900/30 rounded-lg p-3">
                      <p className="text-s2 text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                        {activeCard.keyNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Toned Down Next Card Trigger Action Area */}
              <div className="pt-5 border-t border-zinc-100 dark:border-zinc-900/60 mt-6 w-full">
                <button
                  onClick={handleNextCard}
                  className="w-full bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 border border-zinc-300/70 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60 font-medium text-s2 py-3 rounded-xl transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 tracking-wide hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-900/50"
                >
                  <span>Next Concept Card</span>
                  <ArrowRight size={14} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}