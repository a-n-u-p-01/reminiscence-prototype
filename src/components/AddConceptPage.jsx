import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, Loader2, Sparkles, ChevronDown } from 'lucide-react';
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
  const [animateIn, setAnimateIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('MISTRAL_AI');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const providers = ['MISTRAL_AI', 'CLOUDFLARE', 'SILICONFLOW', 'GROQ', 'GEMINI', 'GITHUBMODELS'];
  const { setStatusMessage } = useHomeEngine();

  const autoResizeRef = (node) => {
    if (node) {
      node.style.height = 'auto';
      node.style.height = `${node.scrollHeight}px`;
    }
  };

  const handleTextareaChange = (field, e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const formatKeyNotes = (text) => {
    if (!text) return '';
    const cleaned = text.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';
    const sentences = cleaned.split(/(?<=\.)\s+/).filter(s => s.trim());
    return sentences.join('\n');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleAnimatedBack = () => {
    if (isSaving || isGenerating) return;
    setAnimateIn(false);
    setTimeout(onBack, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || isSaving) return;

    setIsSaving(true);
    const payload = {
      conceptName: form.title.trim(),
      mainNote: form.note.trim(),
      extraNote: form.extraInfo.trim(),
      question: form.question.trim()
    };

    try {
      await noteService.upsertConcept(payload);
      if (onSave) await onSave(form);
      if (setStatusMessage) {
        setStatusMessage({ text: 'Concept Added', type: 'success' });
      }
      setForm(defaultFormState);
    } catch (error) {
      console.error('Failed to create concept:', error);
      if (setStatusMessage) {
        setStatusMessage({ text: 'Unable to save concept', type: 'error' });
      }
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        if (setStatusMessage) setStatusMessage(null);
      }, 1200);
    }
  };

  const handleGenerate = async () => {
    const title = form.title.trim();
    if (!title) {
      if (setStatusMessage) {
        setStatusMessage({ text: 'Please enter a concept title first', type: 'error' });
        setTimeout(() => setStatusMessage(null), 1500);
      }
      return;
    }

    setIsGenerating(true);
    setIsDropdownOpen(false);

    try {
      const data = await noteService.regenerateConcept(title, selectedProvider);
      setForm((prev) => ({
        ...prev,
        question: data.question || '',
        note: data.mainNote || '',
        extraInfo: formatKeyNotes(data.extraNote || '')
      }));
      if (setStatusMessage) {
        setStatusMessage({ text: 'Generated successfully', type: 'success' });
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      if (setStatusMessage) {
        setStatusMessage({ text: 'Generation failed', type: 'error' });
      }
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        if (setStatusMessage) setStatusMessage(null);
      }, 1500);
    }
  };

  const isFormValid = !!form.title.trim();

  return (
    <div
      className={`max-w-3xl mx-auto text-theme-primary transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform will-change-transform
      ${animateIn
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-3 scale-[0.99]'
        }`}
    >
      <PageHeader
        onBack={handleAnimatedBack}
        title="New Concept"
        subtitle="Anchor a new idea into your review queue."
        actions={(
          <button
            type="submit"
            form="concept-form"
            disabled={isSaving || !isFormValid || isGenerating}
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

      <div className="flex items-center justify-end gap-2 mt-3 mb-4">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isSaving || isGenerating}
            className="flex items-center justify-between gap-2 bg-theme-card hover:bg-theme-card/80 border border-theme hover:border-theme-accent/40 rounded-xl px-3 py-1.5 focus:outline-none transition-all duration-200 disabled:opacity-40 cursor-pointer"
          >
            <span className="text-theme-secondary text-[11px] font-mono tracking-wider font-semibold min-w-[90px] text-left">
              {selectedProvider}
            </span>
            <ChevronDown
              size={11}
              className={`text-theme-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-theme-accent' : ''}`}
            />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-[145px] bg-theme-card border border-theme rounded-xl shadow-2xl overflow-hidden z-30">
              <div className="py-1 flex flex-col">
                {providers.map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(prov);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left font-mono text-[11px] tracking-wide px-3 py-2 transition-colors block ${
                      selectedProvider === prov
                        ? 'bg-theme-accent/10 text-theme-accent font-bold'
                        : 'text-theme-secondary hover:text-theme-primary hover:bg-theme/20'
                    }`}
                  >
                    {prov}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isSaving || isGenerating}
          title="Generate content from title using selected AI model"
          className={`
            relative w-9 h-9 rounded-full
            flex items-center justify-center
            transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            bg-theme-card/60 border-0
            ${isGenerating
              ? 'shadow-[0_0_30px_rgba(245,158,11,0.25)]'
              : 'hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]'
            }
            disabled:opacity-30 disabled:cursor-not-allowed
            group
          `}
        >
          {/* Outer rotating ring – only on hover (idle) */}
          {!isGenerating && (
            <span className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-amber-400/40 transition-all duration-700 group-hover:rotate-180" />
          )}

          {/* Inner pulsing glow when generating */}
          {isGenerating && (
            <>
              <span className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
              <span className="absolute inset-0 rounded-full bg-amber-500/20 animate-pulse" />
            </>
          )}

          <Sparkles
            size={15}
            className={`
              relative z-10
              transition-all duration-500
              ${isGenerating
                ? 'text-amber-400 animate-spin scale-110'
                : 'text-theme-muted group-hover:text-amber-400 group-hover:scale-110 group-hover:rotate-12'
              }
            `}
          />
        </button>
      </div>

      <form id="concept-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-zinc-900/20 border border-zinc-800/50 hover:border-zinc-800/80 rounded-xl p-4 transition-all duration-200 focus-within:border-zinc-700/70">
          <label className="block text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold mb-1 select-none">
            CONCEPT TITLE *
          </label>
          <textarea
            ref={autoResizeRef}
            rows={1}
            required
            disabled={isSaving || isGenerating}
            value={form.title}
            onChange={(e) => handleTextareaChange('title', e)}
            className="w-full bg-transparent text-s3 text-zinc-200 placeholder-zinc-500/40 focus:outline-none resize-none overflow-hidden whitespace-pre-wrap leading-relaxed font-sans disabled:opacity-50"
            placeholder="e.g., Dependency Injection"
          />
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800/50 hover:border-zinc-800/80 rounded-xl p-4 transition-all duration-200 focus-within:border-zinc-700/70">
          <label className="block text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold mb-1 select-none">
            VERIFICATION QUESTION
          </label>
          <textarea
            ref={autoResizeRef}
            rows={1}
            disabled={isSaving || isGenerating}
            value={form.question}
            onChange={(e) => handleTextareaChange('question', e)}
            className="w-full bg-transparent text-s3 text-zinc-200 placeholder-zinc-500/40 focus:outline-none resize-none overflow-hidden whitespace-pre-wrap leading-relaxed font-sans disabled:opacity-50"
            placeholder="What is the core idea?"
          />
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800/50 hover:border-zinc-800/80 rounded-xl p-4 transition-all duration-200 focus-within:border-zinc-700/70">
          <label className="block text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold mb-1 select-none">
            CORE ANCHORING NOTE
          </label>
          <textarea
            ref={autoResizeRef}
            rows={3}
            disabled={isSaving || isGenerating}
            value={form.note}
            onChange={(e) => handleTextareaChange('note', e)}
            className="w-full bg-transparent text-s3 text-zinc-300 placeholder-zinc-500/40 focus:outline-none resize-none overflow-hidden whitespace-pre-wrap leading-relaxed font-sans disabled:opacity-50"
            placeholder="Write the main explanation here..."
          />
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800/50 hover:border-zinc-800/80 rounded-xl p-4 transition-all duration-200 focus-within:border-zinc-700/70">
          <label className="block text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold mb-1 select-none">
            KEY ARCHITECTURE INSIGHTS
          </label>
          <textarea
            ref={autoResizeRef}
            rows={2}
            disabled={isSaving || isGenerating}
            value={form.extraInfo}
            onChange={(e) => handleTextareaChange('extraInfo', e)}
            className="w-full bg-transparent text-s3 text-zinc-300 placeholder-zinc-500/40 focus:outline-none resize-none overflow-hidden whitespace-pre-wrap leading-relaxed font-sans disabled:opacity-50"
            placeholder="Additional insights, examples, or links..."
          />
        </div>
      </form>
    </div>
  );
}