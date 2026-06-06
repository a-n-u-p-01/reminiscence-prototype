import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';

export default function AddConceptPage({ onBack, onSave }) {
  const [form, setForm] = useState({
    title: '',
    note: '',
    extraInfo: '',
    question: ''
  });

  // Structural lifecycle flag for premium CSS state transitions
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // Snap smooth state on paint frame loop
    const frame = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleAnimatedBack = () => {
    setAnimateIn(false);
    // Smooth delay allows down-drift motion before unmounting view completely
    setTimeout(onBack, 200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.note.trim()) return;
    
    setAnimateIn(false);
    setTimeout(() => {
      if (onSave) onSave(form);
    }, 200);
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`max-w-xl mx-auto text-theme-primary transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform
      ${animateIn 
        ? 'opacity-100 translate-y-0 scale-100' 
        : 'opacity-0 translate-y-3 scale-[0.99]'
      }`}
    >
      
      {/* Premium Compact Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-theme/60">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleAnimatedBack}
            className="text-theme-muted hover:text-theme-primary p-1.5 -ml-1.5 rounded-lg transition-colors active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-s4 font-semibold tracking-tight text-theme-primary">New Concept</h1>
          </div>
        </div>

        {/* Premium Minimal Outline Button */}
        <button
          type="submit"
          form="concept-form"
          className="bg-theme-card border border-theme text-theme-secondary hover:text-theme-primary hover:bg-theme font-medium text-s2 px-4 py-1.5 rounded-xl transition-all active:scale-[0.96] flex items-center gap-1.5 shadow-sm font-sans tracking-wide"
        >
          <Check size={12} className="text-theme-accent" />
          <span>Add </span>
        </button>
      </div>

      {/* Main Structural Form Layout */}
      <form id="concept-form" onSubmit={handleSubmit} className="space-y-4">
        
        {/* Row 1: Title & Question (Side-by-Side Split) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-theme-card border border-theme rounded-xl p-3.5 focus-within:border-theme-accent/40 transition-all relative">
            <label className="block text-s1 font-mono tracking-wider text-theme-muted uppercase mb-1 select-none">
              Concept Title *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full bg-transparent text-s3 text-theme-primary placeholder-theme-muted/35 focus:outline-none select-text font-sans"
            />
          </div>

          <div className="bg-theme-card border border-theme rounded-xl p-3.5 focus-within:border-theme-accent/40 transition-all relative">
            <label className="block text-s1 font-mono tracking-wider text-theme-muted uppercase mb-1 select-none">
              Verification Question
            </label>
            <input
              type="text"
              value={form.question}
              onChange={(e) => handleInputChange('question', e.target.value)}
              className="w-full bg-transparent text-s3 text-theme-primary placeholder-theme-muted/35 focus:outline-none select-text font-sans"
            />
          </div>
        </div>

        {/* Row 2: Deep Core Note */}
        <div className="bg-theme-card border border-theme rounded-xl p-3.5 focus-within:border-theme-accent/40 transition-all relative">
          <label className="block text-s1 font-mono tracking-wider text-theme-muted uppercase mb-1 select-none">
            Core Anchoring Note *
          </label>
          <textarea
            required
            rows={3}
            value={form.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            className="w-full bg-transparent text-s3 text-theme-primary placeholder-theme-muted/35 focus:outline-none resize-none leading-relaxed select-text font-sans"
          />
        </div>

        {/* Row 3: Secondary Extra Info */}
        <div className="bg-theme-card border border-theme rounded-xl p-3.5 focus-within:border-theme-accent/40 transition-all relative">
          <label className="block text-s1 font-mono tracking-wider text-theme-muted uppercase mb-1 select-none">
            Extra Reference Info
          </label>
          <textarea
            rows={2}
            value={form.extraInfo}
            onChange={(e) => handleInputChange('extraInfo', e.target.value)}
            className="w-full bg-transparent text-s3 text-theme-primary placeholder-theme-muted/35 focus:outline-none resize-none leading-relaxed select-text font-sans"
          />
        </div>

      </form>
    </div>
  );
}