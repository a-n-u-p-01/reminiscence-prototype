import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Target, ShieldCheck, ArrowRight } from 'lucide-react';

export default function WelcomeSheet({ onComplete }) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // Elegant frame timing to kick off the GPU-accelerated transition smoothly
    const frame = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleDismiss = () => {
    setAnimateIn(false);
    // Let the fade-out animation complete before unmounting via parent state
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 250);
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-5 transition-opacity duration-300 ease-out ${
        animateIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        className={`w-full max-w-md bg-theme-card border border-theme rounded-3xl p-6 space-y-6 shadow-2xl select-none transition-all duration-300 ${
          animateIn 
            ? 'transform translate3d(0,0,0) scale-100 opacity-100' 
            : 'transform translate3d(0,10px,0) scale-95 opacity-0'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Header Block */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-theme border border-theme text-[10px] font-mono tracking-wider uppercase text-theme-accent">
            <Sparkles size={10} className="text-blue-400 animate-spin [animation-duration:6s]" />
            <span>Workspace Initialized</span>
          </div>
          <h2 className="text-base font-semibold tracking-tight text-theme-primary">
            Welcome to Reminiscence
          </h2>
          <p className="text-xs text-theme-muted font-sans leading-relaxed">
            A minimalist workspace engineered to turn fragmented daily development notes into high-retention memory anchors.
          </p>
        </div>

        {/* Feature Stack */}
        <div className="space-y-4 pt-1">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-theme border border-theme text-blue-400 shrink-0">
              <Brain size={14} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-medium text-theme-primary">Contextual Synthesis</h4>
              <p className="text-[11px] text-theme-muted font-sans leading-normal">
                Type raw thoughts. The AI system distills chaos into exact revision points.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-theme border border-theme text-blue-400 shrink-0">
              <Target size={14} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-medium text-theme-primary">Active Repetition</h4>
              <p className="text-[11px] text-theme-muted font-sans leading-normal">
                Review loops trigger dynamically only when core concepts are ready to decay.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-theme border border-theme text-blue-400 shrink-0">
              <ShieldCheck size={14} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-medium text-theme-primary">Zero Cloud Friction</h4>
              <p className="text-[11px] text-theme-muted font-sans leading-normal">
                Your knowledge baseline is sandboxed locally. Safe, immediate, and lightning fast.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDismiss}
          className="w-full bg-blue-500 hover:opacity-90 text-white font-medium text-xs py-3.5 px-4 rounded-xl active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
        >
          <span>Get Started</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}