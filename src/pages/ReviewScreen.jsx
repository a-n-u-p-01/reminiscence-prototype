import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ShieldAlert, Smile, Frown, Layers, X, HelpCircle, ArrowRight, ChevronDown } from 'lucide-react';
import { noteService } from '../api/noteService';
import { useReviewEngine } from '../context/ReviewContext';
import { motion ,AnimatePresence } from 'framer-motion';

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
  // Accordion toggle state for key notes
  const [showNotes, setShowNotes] = useState(false);

  const containerRef = useRef(null);
  const activeCard = concepts[0];

  useEffect(() => {
    if (loading || concepts.length > 0) {
      setShowAnswer(false);
      setInitialCheckDone(true);
      setRewardTrack(false);
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

    containerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    setTimeout(() => {
      handleCardReviewed(activeCard.userConceptId);
      setShowAnswer(false);
      setShowNotes(false); // Reset accordion on new card
      setIsExiting(false);
      setRewardTrack(prev => ({ ...prev, active: false }));
    }, 250);
  };

  // Helper helper to handle both newline-separated points or fallback arrays
  const renderKeyNotes = (notes) => {
    if (!notes) return null;
    const points = Array.isArray(notes) 
      ? notes 
      : notes.split('\n').filter(p => p.trim() !== '');

    return (
      <ul className="space-y-2">
        {points.map((point, index) => (
          <li key={index} className="flex gap-2 text-s3 text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans items-start">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-2 shrink-0" />
            <span>{point.replace(/^[•\-\d.\s]+/, '')}</span>
          </li>
        ))}
      </ul>
    );
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

      <AnimatePresence>
  {showFSRSModal && (
    <motion.div 
      key="fsrs-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      // Changed to clear backdrop with a strong blur effect
      className="fixed inset-0 z-[11000] flex items-center justify-center p-6 bg-zinc-950/20 backdrop-blur-sm"
      onClick={() => setShowFSRSModal(false)}
    >
      <motion.div 
        key="fsrs-modal-card"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        // Increased to max-w-md for a wider, more premium gallery look
        className="bg-zinc-950/90 border border-zinc-900 rounded-xl max-w-md w-full overflow-hidden "
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER */}
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

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            
            {/* AGAIN */}
            <div className="flex gap-6 items-baseline">
              <span className="text-[10px] font-mono text-red-500/80 font-semibold uppercase tracking-widest min-w-[55px]">
                Again
              </span>
              <p className="text-xs text-zinc-400 font-sans tracking-wide">
                <span className="text-zinc-200 font-medium">Forgot.</span> Complete retrieval failure or concept feels entirely unfamiliar.
              </p>
            </div>

            {/* HARD */}
            <div className="flex gap-6 items-baseline">
              <span className="text-[10px] font-mono text-orange-500/80 font-semibold uppercase tracking-widest min-w-[55px]">
                Hard
              </span>
              <p className="text-xs text-zinc-400 font-sans tracking-wide">
                <span className="text-zinc-200 font-medium">Partial.</span> Recognized the subject, but core details were missing.
              </p>
            </div>

            {/* GOOD */}
            <div className="flex gap-6 items-baseline">
              <span className="text-[10px] font-mono text-blue-500/80 font-semibold uppercase tracking-widest min-w-[55px]">
                Good
              </span>
              <p className="text-xs text-zinc-400 font-sans tracking-wide">
                <span className="text-zinc-200 font-medium">Recalled.</span> Remembered the main idea clearly with minimal effort.
              </p>
            </div>

            {/* EASY */}
            <div className="flex gap-6 items-baseline">
              <span className="text-[10px] font-mono text-emerald-500/80 font-semibold uppercase tracking-widest min-w-[55px]">
                Easy
              </span>
              <p className="text-xs text-zinc-400 font-sans tracking-wide">
                <span className="text-zinc-200 font-medium">Fluent.</span> Instantaneous retrieval. Perfect structural understanding.
              </p>
            </div>
          </div>

          {/* FOOTNOTE */}
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
  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-6 flex flex-col justify-start transition-all duration-300"
  style={{
    backfaceVisibility: 'hidden',
    position: showAnswer ? 'absolute' : 'relative',
    visibility: showAnswer ? 'hidden' : 'visible'
  }}
>
  {/* TOP BANNER MODULE */}
  <div className="flex justify-between items-center pb-4 border-b border-zinc-900/60 mb-6">
    <div className="flex items-center gap-2">
      <span className="w-1 h-1 rounded-full bg-zinc-700" />
      <span className="text-[10px] font-medium tracking-[0.25em] font-mono text-zinc-500 uppercase block">
        Active Inquiry
      </span>
    </div>
    <button
      type="button"
      onClick={() => setShowFSRSModal(true)}
      className="text-zinc-600 hover:text-zinc-300 p-1 rounded transition-colors duration-200"
      aria-label="Open Recall Evaluation Guide"
    >
      <HelpCircle size={13} className="stroke-[2]" />
    </button>
  </div>

  {/* MAIN INQUIRY CARD BLOCK */}
  <div className="py-4 min-h-[120px] flex items-start">
    <p className="text-sm text-zinc-200 leading-relaxed font-light tracking-wide w-full font-sans">
      {activeCard?.questionText}
    </p>
  </div>

  {/* CONTEXT & ACTION PANEL */}
  <div className="pt-6 border-t border-zinc-900/60 mt-6 space-y-4">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-medium font-mono text-zinc-600 uppercase tracking-widest block">
        Evaluate Performance
      </span>
      <span className="text-[9px] font-mono text-zinc-500 tracking-wider bg-zinc-900/40 px-2 py-0.5 rounded border border-zinc-900">
        FSRS v5.0
      </span>
    </div>

    {/* MINIMAL ACTION MATRIX */}
    <div className="grid grid-cols-4 gap-2">
      
      {/* AGAIN ACCENT ACTION */}
      <button
        disabled={submittingRating || isExiting}
        onClick={(e) => handleRateCard('FORGOT', e)}
        className="group bg-zinc-900/20 hover:bg-red-950/10 border border-zinc-900 hover:border-red-900/40 py-3.5 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.96] disabled:opacity-20"
      >
        <ShieldAlert size={12} className="text-zinc-600 group-hover:text-red-500/80 transition-colors" />
        <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors tracking-wide">Forget</span>
        {/* CHANGED: Swapped text-zinc-600 with constant state color tones */}
        <span className="text-[9px] font-mono text-red-500/60 group-hover:text-red-400/90 transition-colors tracking-wider uppercase font-medium">
          Reset
        </span>
      </button>

      {/* HARD ACCENT ACTION */}
      <button
        disabled={submittingRating || isExiting}
        onClick={(e) => handleRateCard('PARTIAL', e)}
        className="group bg-zinc-900/20 hover:bg-orange-950/10 border border-zinc-900 hover:border-orange-900/40 py-3.5 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.96] disabled:opacity-20"
      >
        <Frown size={12} className="text-zinc-600 group-hover:text-orange-500/80 transition-colors" />
        <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors tracking-wide">Partial</span>
        {/* CHANGED: Swapped text-zinc-600 with constant state color tones */}
        <span className="text-[9px] font-mono text-orange-500/60 group-hover:text-orange-400/90 transition-colors tracking-wider uppercase font-medium">
          Short
        </span>
      </button>

      {/* GOOD ACCENT ACTION */}
      <button
        disabled={submittingRating || isExiting}
        onClick={(e) => handleRateCard('RECALLED', e)}
        className="group bg-zinc-900/20 hover:bg-blue-950/10 border border-zinc-900 hover:border-blue-900/40 py-3.5 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.96] disabled:opacity-20"
      >
        <Smile size={12} className="text-zinc-600 group-hover:text-blue-500/80 transition-colors" />
        <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors tracking-wide">Recall</span>
        {/* CHANGED: Swapped text-zinc-600 with constant state color tones */}
        <span className="text-[9px] font-mono text-blue-500/60 group-hover:text-blue-400/90 transition-colors tracking-wider uppercase font-medium">
          Norm
        </span>
      </button>

      {/* EASY ACCENT ACTION */}
      <button
        disabled={submittingRating || isExiting}
        onClick={(e) => handleRateCard('FLUENT', e)}
        className="group bg-zinc-900/20 hover:bg-emerald-950/10 border border-zinc-900 hover:border-emerald-900/40 py-3.5 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.96] disabled:opacity-20"
      >
        <CheckCircle2 size={12} className="text-zinc-600 group-hover:text-emerald-500/80 transition-colors" />
        <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors tracking-wide">Fluent</span>
        {/* CHANGED: Swapped text-zinc-600 with constant state color tones */}
        <span className="text-[9px] font-mono text-emerald-500/60 group-hover:text-emerald-400/90 transition-colors tracking-wider uppercase font-medium">
          Skip
        </span>
      </button>

    </div>
  </div>
</div>

            {/* BACK CONTAINER VIEW */}
      <div
    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-6 flex flex-col justify-between transition-all duration-300"
    style={{
      transform: 'rotateY(180deg)',
      backfaceVisibility: 'hidden',
      position: showAnswer ? 'absolute' : 'relative',
      visibility: showAnswer ? 'visible' : 'hidden'
    }}
  >
    <div className="space-y-6 flex-1">
      
      {/* TOP BANNER MODULE */}
      <div className="flex justify-between items-center pb-4 border-b border-zinc-900/60">
        <div className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-blue-500/80" />
          <span className="text-[10px] font-medium tracking-[0.25em] font-mono text-zinc-500 uppercase block">
            Verified Solution
          </span>
        </div>
      </div>

      {/* MAIN ANSWER TEXT BLOCK */}
      <div className="py-2 min-h-[120px] flex items-start">
        <p className="text-sm text-zinc-200 leading-relaxed font-light tracking-wide whitespace-pre-wrap font-sans w-full">
          {activeCard?.answerText}
        </p>
      </div>

      {/* ACCORDION CONTEXTUAL KEY NOTES */}
      {activeCard?.keyNotes && (
        <div className="pt-4 border-t border-zinc-900/60">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="w-full flex items-center justify-between py-2 group focus:outline-none"
          >
            <span className="text-[10px] font-medium tracking-[0.15em] font-mono text-zinc-500 group-hover:text-zinc-300 uppercase block text-left transition-colors">
              Key Insights
            </span>
            <ChevronDown 
              size={13} 
              className={`text-zinc-600 group-hover:text-zinc-400 transition-transform duration-300 ease-[0.22,1,0.36,1] ${showNotes ? 'rotate-180 text-zinc-400' : ''}`} 
            />
          </button>
          
          <div 
            className={`transition-all duration-300 ease-[0.22,1,0.36,1] overflow-hidden ${
              showNotes ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
            }`}
          >
            {/* Removed indentation/borders to give extra info full maximum width matching the answer above */}
            <div className="text-xs text-zinc-400 font-sans tracking-wide leading-relaxed w-full pt-1">
              {renderKeyNotes(activeCard.keyNotes)}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* CONTINUATION LAYER */}
    <div className="pt-6 border-t border-zinc-900/60 mt-8 w-full">
      <button
        onClick={handleNextCard}
        className="group w-full bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-900 text-zinc-400 hover:text-zinc-100 font-medium text-xs py-3.5 rounded-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 tracking-wide"
      >
        <span>Next Concept Card</span>
        <ArrowRight size={13} className="text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all duration-200" />
      </button>
    </div>
  </div>

          </div>
        </div>
      </div>
    </>
  );
}