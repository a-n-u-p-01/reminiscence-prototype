import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { noteService } from '../api/noteService';
import { useHomeEngine } from '../context/HomeContext';
import PageHeader from './PageHeader';

export default function AddConceptPage({ onBack, onSave }) {
  const defaultFormState = {
    title: '',
    note: '',
    extraInfo: '',
    question: ''
  };
  
  const [form, setForm] = useState(defaultFormState);

  // Structural state flags
  const [animateIn, setAnimateIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pull context hook for global status notification capsule
  const { setStatusMessage } = useHomeEngine();

  useEffect(() => {
    // Snap smooth state on paint frame loop
    const frame = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleAnimatedBack = () => {
    if (isSaving) return; // Prevent navigation leaks during active network operations
    setAnimateIn(false);
    // Smooth delay allows down-drift motion before unmounting view completely
    setTimeout(onBack, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || isSaving) return; // Only title is checked here now
    
    setIsSaving(true);

    // Map the form state fields to meet your backend @RequestBody payload structure
    const payload = {
      conceptName: form.title.trim(),
      mainNote: form.note.trim(),
      extraNote: form.extraInfo.trim(),
      question: form.question.trim() 
    };

    try {
      // 1. Fire network persistence pipeline via apiClient bridge layer
      await noteService.upsertConcept(payload);

      // 2. Propagate mutations upstream to notify home collection states
      if (onSave) {
        await onSave(form);
      }

      // 3. Trigger premium floating StatusCapsule feedback alert
      if (setStatusMessage) {
        setStatusMessage({ text: 'Concept Added', type: 'success' });
      }

      // 4. Reset form inputs cleanly to allow consecutive additions without popping back
      setForm(defaultFormState);

    } catch (error) {
      console.error('Failed to create and persist concept layout node:', error);
      
      if (setStatusMessage) {
        setStatusMessage({ text: 'Unable to save concept', type: 'error' });
      }
    } finally {
      setIsSaving(false);

      // Dismiss capsule instance context cleanly after a short visible delay
      setTimeout(() => {
        if (setStatusMessage) setStatusMessage(null);
      }, 1200); // Extended slightly so user can view confirmation clearly while remaining on-page
    }
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Lock save operations until necessary validation parameters are filled (Only title required)
  const isFormValid = !!form.title.trim();

  return (
    <div className={`max-w-3xl mx-auto text-theme-primary transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform
      ${animateIn
        ? 'opacity-100 translate-y-0 scale-100'
        : 'opacity-0 translate-y-3 scale-[0.99]'
      }`}
    >
      
      {/* Unified Page Header */}
      <PageHeader
        onBack={handleAnimatedBack}
        title="New Concept"
        subtitle="Anchor a new idea into your review queue."
        actions={(
          <button
            type="submit"
            form="concept-form"
            disabled={isSaving || !isFormValid}
            className="cursor-pointer bg-blue-500 border border-blue-500 text-white hover:bg-blue-400 hover:border-blue-400 font-semibold text-s2 px-4 py-1.5 rounded-xl transition-all active:scale-[0.96] flex items-center gap-1.5 shadow-sm font-sans tracking-wide disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-theme-card disabled:border-theme disabled:text-theme-secondary disabled:hover:bg-theme-card"
          >
            {isSaving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Check size={12} />
            )}
            <span>Add</span>
          </button>
        )}
      />

      {/* Main Structural Form Layout */}
      <form id="concept-form" onSubmit={handleSubmit} className="space-y-4 mt-5">
        
        {/* Row 1: Title & Question (Side-by-Side Split) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-theme-card border border-theme rounded-xl p-3.5 focus-within:border-theme-accent/40 transition-all relative">
            <label className="block text-s1 font-mono tracking-wider text-theme-muted uppercase mb-1 select-none">
              Concept Title *
            </label>
            <input
              type="text"
              required
              disabled={isSaving}
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full bg-transparent text-s3 text-theme-primary placeholder-theme-muted/35 focus:outline-none select-text font-sans disabled:opacity-50"
            />
          </div>

          <div className="bg-theme-card border border-theme rounded-xl p-3.5 focus-within:border-theme-accent/40 transition-all relative">
            <label className="block text-s1 font-mono tracking-wider text-theme-muted uppercase mb-1 select-none">
              Verification Question
            </label>
            <input
              type="text"
              disabled={isSaving}
              value={form.question}
              onChange={(e) => handleInputChange('question', e.target.value)}
              className="w-full bg-transparent text-s3 text-theme-primary placeholder-theme-muted/35 focus:outline-none select-text font-sans disabled:opacity-50"
            />
          </div>
        </div>

        {/* Row 2: Deep Core Note */}
        <div className="bg-theme-card border border-theme rounded-xl p-3.5 focus-within:border-theme-accent/40 transition-all relative">
          <label className="block text-s1 font-mono tracking-wider text-theme-muted uppercase mb-1 select-none">
            Core Anchoring Note
          </label>
          <textarea
            rows={3}
            disabled={isSaving}
            value={form.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            className="w-full bg-transparent text-s3 text-theme-primary placeholder-theme-muted/35 focus:outline-none resize-none leading-relaxed select-text font-sans disabled:opacity-50"
          />
        </div>

        {/* Row 3: Secondary Extra Info */}
        <div className="bg-theme-card border border-theme rounded-xl p-3.5 focus-within:border-theme-accent/40 transition-all relative">
          <label className="block text-s1 font-mono tracking-wider text-theme-muted uppercase mb-1 select-none">
            Extra Reference Info
          </label>
          <textarea
            rows={2}
            disabled={isSaving}
            value={form.extraInfo}
            onChange={(e) => handleInputChange('extraInfo', e.target.value)}
            className="w-full bg-transparent text-s3 text-theme-primary placeholder-theme-muted/35 focus:outline-none resize-none leading-relaxed select-text font-sans disabled:opacity-50"
          />
        </div>

      </form>
    </div>
  );
}