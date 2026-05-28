import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, User, LogOut, Sliders, BrainCircuit, 
  Palette, Check, Save, ChevronDown, Type 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { setItem } from '../storage/storageService';
import { useSettings } from '../context/SettingsContext';

// --- Premium Custom Dropdown Component ---
function CustomSelect({ value, onChange, options, sizeClass, openUpwards = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative min-w-[140px]" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-2 px-3 rounded-lg text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-all text-left ${sizeClass}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : value}</span>
        <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 ${openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'} w-full min-w-[160px] bg-zinc-950 border border-zinc-800/80 rounded-lg shadow-2xl shadow-black/80 z-50 py-1 max-h-60 overflow-y-auto animate-[fadeIn_0.1s_ease-out]`}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between text-left px-3 py-2 transition-colors ${sizeClass} ${
                opt.value === value 
                  ? 'bg-blue-600/10 text-blue-400 font-medium' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={12} className="text-blue-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main Screen ---
export default function SettingsScreen() {
  const { logout, user } = useAuth();
  
  const [reviewCap, setReviewCap] = useState(25);
  const [algoEngine, setAlgoEngine] = useState('fsrs'); 
  const [defaultSide, setDefaultSide] = useState('front');
  const [autoRevealTimer, setAutoRevealTimer] = useState(0); 

  const { theme: contextTheme, setTheme, textScale: contextTextScale, setTextScale } = useSettings(); 

  // Local draft state – only committed to context on Save
  const [draftTheme, setDraftTheme] = useState(contextTheme);
  const [draftTextScale, setDraftTextScale] = useState(contextTextScale);

  // Keep drafts in sync if context loads async from storage
  useEffect(() => { setDraftTheme(contextTheme); }, [contextTheme]);
  useEffect(() => { setDraftTextScale(contextTextScale); }, [contextTextScale]);
  
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); 
  
  // Isolated button loading state
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const markDirty = (updater) => {
    updater();
    setIsDirty(true);
    if (saveStatus === 'saved') setSaveStatus('idle');
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    
    // Persist theme and text scale via SettingsContext (which updates DOM + storage)
    await setTheme(draftTheme);
    await setTextScale(draftTextScale);

    // Persist other UI‑only settings (store‑only)
    await setItem('reviewCap', String(reviewCap));
    await setItem('algoEngine', algoEngine);
    await setItem('defaultSide', defaultSide);
    await setItem('autoRevealTimer', String(autoRevealTimer));

    setTimeout(() => {
      setSaveStatus('saved');
      setIsDirty(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  // 🌟 NATIVE ANDROID LOGOUT PURGE INTERCEPTOR
  const handleAndroidLogout = () => {
    if (isDisconnecting) return;
    
    // 1. Trigger micro-animation state inside the disconnect button
    setIsDisconnecting(true);

    // 2. Short timeout to let the inline spinner render cleanly before clearing state trees
    setTimeout(() => {
      localStorage.clear();
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.hash = '';
      logout();
    }, 450);
  };

  // Dynamic Typography Scale Map
  const fontMatrix = {
    sm: { root: 'text-sm', label: 'text-xs', desc: 'text-[11px]', title: 'text-base' },
    base: { root: 'text-sm', label: 'text-xs', desc: 'text-[11px]', title: 'text-base' },
    lg: { root: 'text-sm', label: 'text-xs', desc: 'text-[11px]', title: 'text-base' },
    xl: { root: 'text-sm', label: 'text-xs', desc: 'text-[11px]', title: 'text-base' }
  };

  const algoMetadata = {
    fsrs: {
      title: "Smart Balance Model (FSRS)",
      desc: "Our newest, most precise system. It adapts deeply to your personal study habits to pinpoint exactly when you are about to forget a card.",
    },
    sm2: {
      title: "Classic Interval Method (SM-2)",
      desc: "The reliable industry standard. Multiplies gap days steadily based on how easy or difficult you score each card.",
    },
    leitner: {
      title: "Traditional Box Progression",
      desc: "A simple milestones approach. Correct cards graduate to the next box, while incorrect cards get sent straight back to box one.",
    }
  };

  const f = fontMatrix[draftTextScale] || fontMatrix.base;

  return (
    <div className={`text-zinc-100 pb-20 space-y-6 transition-all duration-150 ease-in-out ${f.root} animate-[fadeIn_0.2s_ease-out]`}>
      
      {/* Structural Header */}
      <div className="border-b border-zinc-800/60 pb-5 flex items-center justify-between gap-4 min-h-[56px]">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-blue-500 shrink-0" />
          <h1 className={`font-semibold tracking-tight text-zinc-100 flex items-center ${f.title}`}>
            System Settings
            {isDirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse ml-2" />
            )}
          </h1>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          {(isDirty || saveStatus !== 'idle') && (
            <button
              onClick={handleSaveSettings}
              disabled={saveStatus === 'saving'}
              className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold py-1.5 px-3.5 rounded-lg border transition-all duration-150 active:scale-[0.98] bg-zinc-100 border-zinc-200 text-zinc-950 hover:bg-zinc-200"
            >
              {saveStatus === 'saving' ? (
                <span className="h-3 w-3 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
              ) : saveStatus === 'saved' ? (
                <Check size={12} className="stroke-[3]" />
              ) : (
                <Save size={12} />
              )}
              <span>{saveStatus === 'saving' ? 'SAVING' : saveStatus === 'saved' ? 'SAVED' : 'SAVE'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Identity Component */}
      <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-blue-400 shrink-0">
            <User size={15} />
          </div>
          <div className="min-w-0">
            <h3 className={`font-mono font-bold text-zinc-200 truncate ${f.label}`}>
              {user?.fullName || user?.name || 'Active Operator'}
            </h3>
            <p className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">
              {user?.email || 'node-session@system'}
            </p>
          </div>
        </div>
        
        {/* Isolated Disconnect Button Animation Trigger */}
        <button 
          onClick={handleAndroidLogout}
          disabled={isDisconnecting}
          className={`flex items-center gap-2 border text-[10px] font-mono uppercase font-bold px-3 py-2 rounded-lg transition-all min-w-[105px] justify-center shrink-0 active:scale-[0.98] ${
            isDisconnecting 
              ? 'bg-red-950/20 border-red-900/30 text-red-400/80 opacity-90' 
              : 'border-zinc-800 bg-zinc-950 hover:bg-red-950/20 hover:border-red-900/40 text-zinc-400 hover:text-red-400'
          }`}
        >
          {isDisconnecting ? (
            <span className="h-3 w-3 border-[1.5px] border-red-400/20 border-t-red-400 rounded-full animate-spin" />
          ) : (
            <LogOut size={11} className="shrink-0" />
          )}
          <span>{isDisconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
        </button>
      </div>

      {/* Settings Sections Container */}
      <div className="space-y-6">
        
        {/* Section 1: Algorithmic Core */}
        <div className="space-y-2.5">
          <div className="px-0.5 flex items-center gap-2 text-zinc-400">
            <BrainCircuit size={13} className="text-blue-500/80" />
            <h4 className="text-[10px] font-mono font-bold tracking-wider uppercase">Study Logic</h4>
          </div>
          
          <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl divide-y divide-zinc-800/40 overflow-visible">
            
            {/* Setting: Calculation Engine Selection */}
            <div className="p-4 space-y-3.5">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-1 max-w-[400px]">
                  <label className={`font-medium text-zinc-200 block ${f.label}`}>Calculation Engine</label>
                  <p className={`text-zinc-500 leading-normal ${f.desc}`}>
                    Changes the underlying math formula system used to determine card intervals.
                  </p>
                </div>
                <CustomSelect
                  value={algoEngine}
                  onChange={(val) => markDirty(() => setAlgoEngine(val))}
                  sizeClass={f.label}
                  options={[
                    { value: 'fsrs', label: 'Smart Balance' },
                    { value: 'sm2', label: 'Classic Interval' },
                    { value: 'leitner', label: 'Leitner Boxes' }
                  ]}
                />
              </div>

              {/* Dynamic Info Explanation Panel */}
              <div key={algoEngine} className="bg-zinc-950/40 border border-zinc-800/50 rounded-lg p-3 space-y-1 animate-[fadeIn_0.15s_ease-out]">
                <div className={`text-blue-400 font-mono font-bold tracking-tight ${f.label}`}>
                  {algoMetadata[algoEngine].title}
                </div>
                <p className={`text-zinc-400 leading-normal ${f.desc}`}>
                  {algoMetadata[algoEngine].desc}
                </p>
              </div>
            </div>

            {/* Setting: Daily Cap */}
            <div className="p-4 flex items-start justify-between gap-6">
              <div className="space-y-1 max-w-[400px]">
                <label className={`font-medium text-zinc-200 block ${f.label}`}>Daily Queue Limit</label>
                <p className={`text-zinc-500 leading-normal ${f.desc}`}>
                  Limits how many scheduled review cards you are allowed to see in a single day.
                </p>
              </div>
              <CustomSelect
                value={reviewCap}
                onChange={(val) => markDirty(() => setReviewCap(val))}
                sizeClass={f.label}
                options={[
                  { value: 10, label: '10 Cards' },
                  { value: 25, label: '25 Cards' },
                  { value: 50, label: '50 Cards' },
                  { value: 999, label: 'No Limit' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Automation & Flow */}
        <div className="space-y-2.5">
          <div className="px-0.5 flex items-center gap-2 text-zinc-400">
            <Sliders size={13} className="text-blue-500/80" />
            <h4 className="text-[10px] font-mono font-bold tracking-wider uppercase">Card Layout</h4>
          </div>

          <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl divide-y divide-zinc-800/40 overflow-visible">
            
            {/* Setting: Card Orientation */}
            <div className="p-4 flex items-start justify-between gap-6">
              <div className="space-y-1 max-w-[400px]">
                <label className={`font-medium text-zinc-200 block ${f.label}`}>Default Card Side</label>
                <p className={`text-zinc-500 leading-normal ${f.desc}`}>
                  Controls whether a card defaults to showing the front question first or reverse answer layer first.
                </p>
              </div>
              <CustomSelect
                value={defaultSide}
                onChange={(val) => markDirty(() => setDefaultSide(val))}
                sizeClass={f.label}
                options={[
                  { value: 'front', label: 'Question First' },
                  { value: 'back', label: 'Answer First' }
                ]}
              />
            </div>

            {/* Setting: Auto-Reveal Timer */}
            <div className="p-4 flex items-start justify-between gap-6">
              <div className="space-y-1 max-w-[400px]">
                <label className={`font-medium text-zinc-200 block ${f.label}`}>Auto-Reveal Timer</label>
                <p className={`text-zinc-500 leading-normal ${f.desc}`}>
                  Automatically flips to reveal the card answer after a certain number of seconds pass.
                </p>
              </div>
              <CustomSelect
                value={autoRevealTimer}
                onChange={(val) => markDirty(() => setAutoRevealTimer(val))}
                sizeClass={f.label}
                options={[
                  { value: 0, label: 'Off (Manual)' },
                  { value: 5, label: '5 Seconds' },
                  { value: 10, label: '10 Seconds' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Workspace Environment */}
        <div className="space-y-2.5">
          <div className="px-0.5 flex items-center gap-2 text-zinc-400">
            <Palette size={13} className="text-blue-500/80" />
            <h4 className="text-[10px] font-mono font-bold tracking-wider uppercase">Display Settings</h4>
          </div>

          <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl divide-y divide-zinc-800/40 overflow-visible">
            
            {/* Setting: Segmented Text Size Scale Controller */}
            <div className="p-4 flex items-start justify-between gap-6">
              <div className="space-y-1 max-w-[400px]">
                <div className="flex items-center gap-1.5">
                  <Type size={14} className="text-zinc-400 shrink-0" />
                  <label className={`font-medium text-zinc-200 ${f.label}`}>Interface Text Size</label>
                </div>
                <p className={`text-zinc-500 leading-normal ${f.desc}`}>
                  Changes the overall sizing configuration of the interface text to scale readability up or down.
                </p>
              </div>
              
              <div className="flex bg-zinc-950 border border-zinc-800 p-0.5 rounded-lg shrink-0 w-[140px]">
                {['sm', 'base', 'lg', 'xl'].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => markDirty(() => setDraftTextScale(scale))}
                    className={`flex-1 text-center py-1 text-[10px] font-mono uppercase font-bold rounded-md transition-all ${
                      draftTextScale === scale
                        ? 'bg-zinc-800 text-blue-400 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            </div>

            {/* Setting: Theme Accent */}
            <div className="p-4 flex items-start justify-between gap-6">
              <div className="space-y-1 max-w-[400px]">
                <label className={`font-medium text-zinc-200 block ${f.label}`}>Color Theme</label>
                <p className={`text-zinc-500 leading-normal ${f.desc}`}>
                  Alters the base color shading profile applied to your active application panel environment.
                </p>
              </div>
              <CustomSelect
                value={draftTheme}
                onChange={(val) => markDirty(() => setDraftTheme(val))}
                sizeClass={f.label}
                openUpwards={true}
                options={[
                  { value: 'zinc', label: 'Midnight Zinc (Dark)' },
                  { value: 'slate', label: 'Monolith Slate (Dark)' },
                  { value: 'ocean', label: 'Abyssal Blue (Dark)' },
                  { value: 'matte', label: 'Charcoal Matte (Dark)' },
                  { value: 'frost', label: 'Clean Frost (Light)' },
                  { value: 'sand', label: 'Warm Sand (Light)' }
                ]}
              />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}