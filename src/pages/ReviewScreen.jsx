import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ShieldAlert, Smile, Frown, Layers, X, HelpCircle, ArrowRight, ChevronDown } from 'lucide-react';
import { noteService } from '../api/noteService';
import { useReviewEngine } from '../context/ReviewContext';
import { motion, AnimatePresence } from 'framer-motion';
import CopyButton from '../components/CopyButton';
import PageHeader from '../components/PageHeader';

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
  const [showNotes, setShowNotes] = useState(false);

  const containerRef = useRef(null);
  const activeCard = concepts?.[0];

  useEffect(() => {
    if (loading || (concepts && concepts.length > 0)) {
      setShowAnswer(false);
      setInitialCheckDone(true);
      setRewardTrack({ x: 0, y: 0, color: '', glow: '', active: false });
    } else {
      const timer = setTimeout(() => setInitialCheckDone(true), 180);
      return () => clearTimeout(timer);
    }
  }, [loading, concepts?.length]);

  const handleRateCard = async (rating, e) => {
    if (submittingRating || isExiting) return;

    if (e && e.clientX && e.clientY) {
      let coreColor = '#3b82f6';
      let glowColor = 'rgba(59, 130, 246, 0.45)';

      if (rating === "FORGOT") {
        coreColor = '#ef4444';
        glowColor = 'rgba(239, 68, 68, 0.5)';
      } else if (rating === "PARTIAL") {
        coreColor = '#f97316';
        glowColor = 'rgba(249, 115, 22, 0.5)';
      } else if (rating === "FLUENT") {
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

    if (rating === "FORGOT") {
      messageText = "Lapse Handled • Reviewing Soon";
      capsuleType = "error";
    } else if (rating === "PARTIAL") {
      messageText = "Struggled • Core Trace Maintained";
      capsuleType = "warn";
    } else if (rating === "RECALLED") {
      messageText = "Interval Updated Successfully";
      capsuleType = "success";
    } else if (rating === "FLUENT") {
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

    containerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    setTimeout(() => {
      handleCardReviewed(activeCard.userConceptId);
      setShowAnswer(false);
      setShowNotes(false);
      setIsExiting(false);
      setRewardTrack(prev => ({ ...prev, active: false }));
    }, 250);
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

  return (
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

      {typeof document !== 'undefined' && createPortal(
        <>
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

          <AnimatePresence>
            {showFSRSModal && (
              <motion.div 
                key="fsrs-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[11000] flex items-center justify-center p-6 bg-zinc-950/20 backdrop-blur-sm"
                onClick={() => setShowFSRSModal(false)}
              >
                <motion.div 
                  key="fsrs-modal-card"
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-zinc-950/90 border border-zinc-900 rounded-xl max-w-md w-full overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-zinc-900 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <HelpCircle size={14} className="text-zinc-500" />
                      <h3 className="text-[10px] font-medium text-zinc-500 font-mono tracking-[0.3em] uppercase">
                        Evaluation Guide
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowFSRSModal(false)}
                      className="p-1 rounded-sm text-zinc-600 hover:text-zinc-200 transition-colors active:scale-90"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex gap-6 items-baseline">
                        <span className="text-[10px] font-mono text-red-500/80 font-semibold uppercase tracking-widest min-w-[55px]">
                          Again
                        </span>
                        <p className="text-xs text-zinc-400 font-sans tracking-wide">
                          <span className="text-zinc-200 font-medium">Forgot.</span> Complete retrieval failure or concept feels entirely unfamiliar.
                        </p>
                      </div>

                      <div className="flex gap-6 items-baseline">
                        <span className="text-[10px] font-mono text-orange-500/80 font-semibold uppercase tracking-widest min-w-[55px]">
                          Hard
                        </span>
                        <p className="text-xs text-zinc-400 font-sans tracking-wide">
                          <span className="text-zinc-200 font-medium">Partial.</span> Recognized the subject, but core details were missing.
                        </p>
                      </div>

                      <div className="flex gap-6 items-baseline">
                        <span className="text-[10px] font-mono text-blue-500/80 font-semibold uppercase tracking-widest min-w-[55px]">
                          Good
                        </span>
                        <p className="text-xs text-zinc-400 font-sans tracking-wide">
                          <span className="text-zinc-200 font-medium">Recalled.</span> Remembered the main idea clearly with minimal effort.
                        </p>
                      </div>

                      <div className="flex gap-6 items-baseline">
                        <span className="text-[10px] font-mono text-emerald-500/80 font-semibold uppercase tracking-widest min-w-[55px]">
                          Easy
                        </span>
                        <p className="text-xs text-zinc-400 font-sans tracking-wide">
                          <span className="text-zinc-200 font-medium">Fluent.</span> Instantaneous retrieval. Perfect structural understanding.
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] text-zinc-600 font-mono tracking-wide pt-4 border-t border-zinc-900/60 leading-relaxed">
                      Be honest rather than optimistic. Accurate grades optimize scheduling intervals.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}

      <div ref={containerRef} className="w-full space-y-6 min-h-[350px] max-w-3xl mx-auto pb-32 text-zinc-800 dark:text-zinc-100 select-none">
        
        <PageHeader
          icon={Layers}
          title="Recall Active Engine"
          subtitle="Active retention tracking loop."
          actions={(
            <span className="text-s2 font-mono bg-theme-card text-theme-secondary font-medium px-2.5 py-1 rounded-full border border-theme shadow-sm">
              Queue: {loading ? '...' : concepts?.length || 0}
            </span>
          )}
        />

        <div className="relative h-[2px] -mt-5 overflow-hidden rounded-full">
          {loading && (
            <motion.div
              initial={{ left: '-100%' }}
              animate={{ left: '100%' }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-theme-accent to-transparent"
            />
          )}
        </div>

        {loading ? (
          <div className="min-h-[260px] flex items-center justify-center">
            <p className="text-xs font-mono tracking-[0.2em] text-zinc-400 dark:text-zinc-500 uppercase animate-pulse">
              Loading...
            </p>
          </div>
        ) : !concepts || concepts.length === 0 ? (
          initialCheckDone && (
            <div className="min-h-[280px] flex flex-col items-center justify-center text-center gap-5 px-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full" />
                <div className="relative h-16 w-16 rounded-2xl bg-theme-card border border-theme flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={28} strokeWidth={1.6} />
                </div>
              </div>
              <div className="space-y-1.5 max-w-[260px]">
                <p className="text-s2 font-medium text-theme-primary tracking-tight">All caught up</p>
                <p className="text-s1 text-theme-muted leading-relaxed">
                  No concepts are due right now. New reviews will surface here exactly when they're ready to decay.
                </p>
              </div>
              {onBackToHome && (
                <button
                  onClick={onBackToHome}
                  className="mt-1 text-s1 font-mono uppercase tracking-widest text-theme-muted hover:text-theme-accent transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-theme bg-theme-card active:scale-[0.98]"
                >
                  <span>Back to home</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          )
        ) : (
          <div
            className={`w-full transition-all duration-300 ${isExiting ? 'opacity-0 scale-98 blur-[1px]' : 'opacity-100 scale-100'}`}
            style={{ perspective: '1200px' }}
          >
            <div
              key={activeCard?.userConceptId}
              className="grid grid-cols-1 grid-rows-1 w-full transition-transform duration-500"
              style={{
                transform: showAnswer ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* FRONT CONTAINER – balanced spacing */}
              <div
                className="col-start-1 row-start-1 w-full bg-theme-card border border-theme rounded-xl p-5 flex flex-col justify-between transition-all duration-300"
                style={{
                  backfaceVisibility: 'hidden',
                  pointerEvents: showAnswer ? 'none' : 'auto',
                  visibility: showAnswer ? 'hidden' : 'visible'
                }}
              >
                <div className="flex justify-between items-center pb-2.5 border-b border-theme mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400/70" />
                    <span className="text-[10px] font-medium tracking-[0.15em] font-mono text-theme-muted uppercase">
                      Active Inquiry
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFSRSModal(true)}
                    className="text-theme-muted hover:text-theme-primary p-1 rounded-lg transition-colors duration-200 hover:bg-theme/20 active:scale-90"
                    aria-label="Open Recall Evaluation Guide"
                  >
                    <HelpCircle size={14} className="stroke-[1.8]" />
                  </button>
                </div>

                <div className="py-1.5 flex items-start pl-3 border-l-2 border-blue-400/30">
                  <p className="text-[15px] text-theme-primary leading-relaxed font-medium tracking-wide w-full font-sans">
                    {activeCard?.questionText || "No question available"}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-theme mt-1.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium font-mono text-theme-muted uppercase tracking-widest">
                      Evaluate Performance
                    </span>
                    <span className="text-[9px] font-mono text-theme-muted/60 tracking-wider bg-theme/30 px-2.5 py-0.5 rounded-full border border-theme">
                      FSRS v5.1
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <button
                      disabled={submittingRating || isExiting}
                      onClick={(e) => handleRateCard('FORGOT', e)}
                      className="cursor-pointer group relative bg-theme/20 hover:bg-red-950/30 border border-theme hover:border-red-700/50 py-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-[0.95] disabled:opacity-30"
                    >
                      <ShieldAlert size={14} className="text-theme-muted group-hover:text-red-400 group-hover:scale-110 transition-all duration-200" />
                      <span className="text-[10px] font-medium text-theme-secondary group-hover:text-theme-primary transition-colors tracking-wide">Forget</span>
                      <span className="text-[7px] font-mono text-red-500/50 group-hover:text-red-400/90 transition-colors tracking-widest uppercase">Reset</span>
                      <span className="absolute inset-0 rounded-xl border border-red-400/0 group-hover:border-red-400/20 transition-all duration-300" />
                    </button>

                    <button
                      disabled={submittingRating || isExiting}
                      onClick={(e) => handleRateCard('PARTIAL', e)}
                      className="cursor-pointer group relative bg-theme/20 hover:bg-orange-950/30 border border-theme hover:border-orange-700/50 py-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-[0.95] disabled:opacity-30"
                    >
                      <Frown size={14} className="text-theme-muted group-hover:text-orange-400 group-hover:scale-110 transition-all duration-200" />
                      <span className="text-[10px] font-medium text-theme-secondary group-hover:text-theme-primary transition-colors tracking-wide">Partial</span>
                      <span className="text-[7px] font-mono text-orange-500/50 group-hover:text-orange-400/90 transition-colors tracking-widest uppercase">Short</span>
                      <span className="absolute inset-0 rounded-xl border border-orange-400/0 group-hover:border-orange-400/20 transition-all duration-300" />
                    </button>

                    <button
                      disabled={submittingRating || isExiting}
                      onClick={(e) => handleRateCard('RECALLED', e)}
                      className="cursor-pointer group relative bg-theme/20 hover:bg-blue-950/30 border border-theme hover:border-blue-700/50 py-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-[0.95] disabled:opacity-30"
                    >
                      <Smile size={14} className="text-theme-muted group-hover:text-blue-400 group-hover:scale-110 transition-all duration-200" />
                      <span className="text-[10px] font-medium text-theme-secondary group-hover:text-theme-primary transition-colors tracking-wide">Recall</span>
                      <span className="text-[7px] font-mono text-blue-500/50 group-hover:text-blue-400/90 transition-colors tracking-widest uppercase">Norm</span>
                      <span className="absolute inset-0 rounded-xl border border-blue-400/0 group-hover:border-blue-400/20 transition-all duration-300" />
                    </button>

                    <button
                      disabled={submittingRating || isExiting}
                      onClick={(e) => handleRateCard('FLUENT', e)}
                      className="cursor-pointer group relative bg-theme/20 hover:bg-emerald-950/30 border border-theme hover:border-emerald-700/50 py-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-[0.95] disabled:opacity-30"
                    >
                      <CheckCircle2 size={14} className="text-theme-muted group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-200" />
                      <span className="text-[10px] font-medium text-theme-secondary group-hover:text-theme-primary transition-colors tracking-wide">Fluent</span>
                      <span className="text-[7px] font-mono text-emerald-500/50 group-hover:text-emerald-400/90 transition-colors tracking-widest uppercase">Skip</span>
                      <span className="absolute inset-0 rounded-xl border border-emerald-400/0 group-hover:border-emerald-400/20 transition-all duration-300" />
                    </button>
                  </div>
                </div>
              </div>

              {/* BACK CONTAINER – unchanged */}
              <div
                className="col-start-1 row-start-1 w-full bg-theme-card border border-theme rounded-xl p-6 flex flex-col justify-between transition-all duration-300"
                style={{
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                  pointerEvents: showAnswer ? 'auto' : 'none',
                  visibility: showAnswer ? 'visible' : 'hidden'
                }}
              >
                <div className="space-y-5 flex-1">
                  <div className="flex justify-between items-center pb-4 border-b border-theme">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
                      <span className="text-[10px] font-medium tracking-[0.25em] font-mono text-theme-muted uppercase">
                        {activeCard?.name || 'Concept'}
                      </span>
                    </div>
                    <CopyButton text={activeCard?.name} className="text-theme-muted hover:text-theme-primary p-1.5 rounded-lg transition-colors duration-200 hover:bg-theme/20 active:scale-90" />
                  </div>

                  <div className="py-3 min-h-[120px] flex items-start">
                    <p className="text-[15px] text-theme-primary leading-relaxed font-light tracking-wide whitespace-pre-wrap font-sans w-full">
                      {activeCard?.answerText}
                    </p>
                  </div>

                  {activeCard?.keyNotes && (
                    <div className="pt-4 border-t border-theme">
                      <button
                        type="button"
                        onClick={() => setShowNotes(!showNotes)}
                        className="w-full flex items-center justify-between py-2 group focus:outline-none"
                      >
                        <span className="text-[10px] font-medium tracking-[0.15em] font-mono text-theme-muted group-hover:text-theme-primary uppercase transition-colors">
                          Key Insights
                        </span>
                        <ChevronDown
                          size={14}
                          className={`text-theme-muted group-hover:text-theme-primary transition-transform duration-300 ease-[0.22,1,0.36,1] ${
                            showNotes ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <div
                        className={`transition-all duration-300 ease-[0.22,1,0.36,1] overflow-hidden ${
                          showNotes ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="text-xs text-theme-secondary font-sans tracking-wide leading-relaxed w-full pt-1">
                          {renderKeyNotes(activeCard.keyNotes)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-5 border-t border-theme mt-6 w-full">
                  <button
                    onClick={handleNextCard}
                    className="group w-full bg-theme/20 hover:bg-theme/40 border border-theme text-theme-secondary hover:text-theme-primary font-medium text-xs py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 tracking-wide"
                  >
                    <span>Next Concept Card</span>
                    <ArrowRight size={14} className="text-theme-muted group-hover:text-theme-primary group-hover:translate-x-0.5 transition-all duration-200" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}