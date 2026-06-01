import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Calendar, Flame, Layers, Trophy, Activity, ChevronLeft, ChevronRight, Eye, Cpu, Terminal, Loader2, Plus, X, Save, Check, AlertCircle } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { noteService } from '../api/noteService'; 

export default function DashboardScreen() {
  const heatmapScrollContainerRef = useRef(null);

  // Destructure data matrices directly from state architecture
  const {
    todayStr,
    selectedDate,
    setSelectedDate,
    heatmapData,
    metrics,
    activeDayDetails,
    isLoadingHeatmap,
    isLoadingActivity
  } = useDashboard();

  // Premium Management State for Topic Customization
  const [localTopics, setLocalTopics] = useState([]);
  const [localDeletedTopics, setLocalDeletedTopics] = useState([]);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'sync' | 'success' | 'error' | 'restricted'

  // Sync state cleanly whenever the day ledger transforms
  useEffect(() => {
    if (activeDayDetails?.dailyLog?.extractedTopics) {
      setLocalTopics(activeDayDetails.dailyLog.extractedTopics);
    } else {
      setLocalTopics([]);
    }
    setLocalDeletedTopics([]); // Reset deleted nodes stack on date/ledger transition
    setNewTopicInput('');
    setSaveStatus('idle');
  }, [activeDayDetails]);

  // Track deep differences to control the Save action button state cleanly
  const hasChanges = useMemo(() => {
    const originalTopics = activeDayDetails?.dailyLog?.extractedTopics || [];
    if (originalTopics.length !== localTopics.length) return true;
    
    const sortedOriginal = [...originalTopics].sort();
    const sortedLocal = [...localTopics].sort();
    return sortedOriginal.some((val, i) => val !== sortedLocal[i]);
  }, [localTopics, activeDayDetails]);

  // Handle local state addition
  const handleAddTopicSubmit = (e) => {
    e.preventDefault();
    const sanitized = newTopicInput.trim();
    if (!sanitized) return;
    if (localTopics.includes(sanitized)) {
      setNewTopicInput('');
      return;
    }
    
    // If it was in deleted queue, remove it from there
    if (localDeletedTopics.includes(sanitized)) {
      setLocalDeletedTopics(prev => prev.filter(t => t !== sanitized));
    }

    setLocalTopics(prev => [...prev, sanitized]);
    setNewTopicInput('');
    if (saveStatus !== 'idle') setSaveStatus('idle');
  };

  // Handle local state exclusion (move to deleted topics pipeline)
  const handleRemoveTopic = (targetTopic) => {
    setLocalTopics(prev => prev.filter(topic => topic !== targetTopic));
    if (!localDeletedTopics.includes(targetTopic)) {
      setLocalDeletedTopics(prev => [...prev, targetTopic]);
    }
    if (saveStatus !== 'idle') setSaveStatus('idle');
  };

  // Handle restoring a previously excluded topic node
  const handleRestoreTopic = (targetTopic) => {
    setLocalDeletedTopics(prev => prev.filter(topic => topic !== targetTopic));
    if (!localTopics.includes(targetTopic)) {
      setLocalTopics(prev => [...prev, targetTopic]);
    }
    if (saveStatus !== 'idle') setSaveStatus('idle');
  };

  // Inline adaptive save pipeline 
  const handleSaveChanges = async () => {
    if (selectedDate !== todayStr || !activeDayDetails?.dailyLog) {
      setSaveStatus('restricted');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    try {
      setSaveStatus('sync');
      await noteService.updateExtractedTopics(localTopics);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Failed to commit topic customization matrix update:", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  // Build GitHub-style Heatmap Cells (True 365-Day Rolling Window)
  const heatmapCells = useMemo(() => {
    const cells = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      cells.push({
        date: dateStr,
        count: heatmapData[dateStr] || 0,
        day: current.getDay(),
      });
      current.setDate(current.getDate() + 1);
    }
    return cells;
  }, [heatmapData]);

  // Handle auto-scroll positioning
  useEffect(() => {
    const container = heatmapScrollContainerRef.current;
    if (!container || isLoadingHeatmap) return;

    const scrollTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        if (maxScrollLeft > 0) {
          container.scrollTo({
            left: maxScrollLeft + 100, 
            behavior: 'instant' 
          });
        }
      });
    }, 100);

    return () => clearTimeout(scrollTimer);
  }, [heatmapCells, isLoadingHeatmap]);

  const handleStepDate = (direction) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const current = new Date(year, month - 1, day);
    current.setDate(current.getDate() + direction);

    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const targetStr = `${yyyy}-${mm}-${dd}`;

    if (targetStr > todayStr) return;
    setSelectedDate(targetStr);
  };

  const getCellIntensityClass = (count) => {
    if (count === 0) return 'bg-zinc-900/40 border-zinc-950';
    if (count <= 2) return 'bg-blue-950/40 text-blue-400 border-blue-900/30';
    if (count <= 4) return 'bg-blue-800/40 text-blue-300 border-blue-700/40';
    if (count <= 6) return 'bg-blue-600/50 text-blue-200 border-blue-500/50';
    return 'bg-blue-500 text-zinc-950 border-blue-400';
  };

  const formatDisplayDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isTodayActive = selectedDate === todayStr;
  const isButtonBusy = saveStatus === 'sync' || saveStatus === 'success' || saveStatus === 'error' || saveStatus === 'restricted';
  const isSaveActiveAndValid = isTodayActive && hasChanges && !isButtonBusy;

  // Compute Premium Dynamic Layout Context for the Action Button
  const saveButtonConfig = useMemo(() => {
    switch (saveStatus) {
      case 'sync':
        return {
          style: 'bg-zinc-900 text-zinc-400 border-zinc-800 pointer-events-none',
          icon: <Loader2 size={11} className="animate-spin text-blue-400" />,
          text: 'Syncing Matrix...'
        };
      case 'success':
        return {
          style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 scale-[0.98] pointer-events-none',
          icon: <Check size={11} />,
          text: 'Saved Safely'
        };
      case 'error':
        return {
          style: 'bg-red-500/10 text-red-400 border-red-500/30 pointer-events-none',
          icon: <AlertCircle size={11} />,
          text: 'Pipeline Error'
        };
      case 'restricted':
        return {
          style: 'bg-amber-500/10 text-amber-400 border-amber-500/30 pointer-events-none',
          icon: <AlertCircle size={11} />,
          text: 'Today Only'
        };
      default:
        return {
          style: isSaveActiveAndValid
            ? 'bg-blue-500 text-zinc-950 border-blue-400 hover:bg-blue-400 active:scale-[0.98] cursor-pointer'
            : 'bg-zinc-900 text-zinc-600 border-zinc-800/80 opacity-50 cursor-not-allowed',
          icon: <Save size={11} />,
          text: 'Save Log Changes'
        };
    }
  }, [saveStatus, isSaveActiveAndValid]);

  return (
    <div className="space-y-6 animate-[fadeIn_0.15s_ease-out] pb-12 text-theme-primary max-w-4xl mx-auto relative select-none transition-all duration-300 ease-in-out pt-4">
      
      {/* Visual Header */}
      <div className="border-b border-theme pb-4">
        <h1 className="text-xl font-bold tracking-tight text-theme-primary flex items-center gap-2">
          <Activity size={18} className="text-blue-500 shrink-0" />
          <span>Retention Engine Dashboard</span>
        </h1>
        <p className="text-xs text-theme-secondary mt-0.5">Tracking automated concept extraction and memory review logs.</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between h-24 transition-all hover:scale-[1.01]">
          <div className="flex items-center gap-2 text-theme-secondary">
            <Flame size={15} className="text-blue-500 shrink-0" />
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono truncate">Streak</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-theme-primary">{metrics.currentStreak}</span>
            <span className="text-[10px] font-medium text-theme-muted uppercase">days</span>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between h-24 transition-all hover:scale-[1.01]">
          <div className="flex items-center gap-2 text-theme-secondary">
            <Layers size={15} className="text-blue-400 shrink-0" />
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono truncate">Concepts</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-theme-primary">{metrics.totalConceptsCount}</span>
            <span className="text-[10px] font-medium text-theme-muted uppercase">items</span>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between h-24 transition-all hover:scale-[1.01]">
          <div className="flex items-center gap-2 text-theme-secondary">
            <Trophy size={15} className="text-emerald-400 shrink-0" />
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono truncate">Mastery</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-theme-primary">{metrics.averageMasteryScore}</span>
            <span className="text-[10px] font-medium text-theme-muted">%</span>
          </div>
        </div>
      </div>

      {/* Engineering Map Grid Wrapper */}
      <div className="bg-theme-card border border-theme rounded-xl p-4 space-y-3 shadow-inner">
        <div className="flex justify-between items-center text-[10px] font-mono tracking-wider text-theme-secondary">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} className="text-theme-muted" />
            365-Day Engineering Log Matrix
          </span>
          {isLoadingHeatmap && (
            <span className="flex items-center gap-1 text-[9px] text-blue-400 font-mono transition-opacity">
              <Loader2 size={10} className="animate-spin" /> Syncing Matrix...
            </span>
          )}
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-theme-card to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-theme-card to-transparent z-10" />

          <div
            ref={heatmapScrollContainerRef}
            onTouchStart={(e) => e.stopPropagation()}
            style={{ touchAction: 'pan-x' }}
            className={`overflow-x-auto pb-2 pt-1 -mx-2 px-2 pr-2 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-800 transition-all duration-500 ${
              isLoadingHeatmap ? 'opacity-40 scale-[0.985]' : 'opacity-100 scale-100'
            }`}
          >
            {(() => {
              const weeks = [];
              for (let i = 0; i < heatmapCells.length; i += 7) {
                weeks.push(heatmapCells.slice(i, i + 7));
              }

              const monthLabels = [];
              for (let i = 0; i < weeks.length; i++) {
                const week = weeks[i];
                if (!week[0]) continue;
                
                const currentMonth = new Date(week[0].date).getMonth();
                const prevMonth = i > 0 ? new Date(weeks[i - 1][0].date).getMonth() : null;
                
                if (currentMonth !== prevMonth) {
                  if (monthLabels.length > 0 && (i - monthLabels[monthLabels.length - 1].index < 3)) {
                    monthLabels[monthLabels.length - 1] = {
                      index: i,
                      label: new Date(week[0].date).toLocaleDateString('en-US', { month: 'short' })
                    };
                  } else {
                    monthLabels.push({
                      index: i,
                      label: new Date(week[0].date).toLocaleDateString('en-US', { month: 'short' })
                    });
                  }
                }
              }

              return (
                <div className="w-max space-y-1.5">
                  <div className="relative h-4 mb-1">
                    {monthLabels.map(({ index, label }) => (
                      <span
                        key={index}
                        className="absolute text-[9px] text-theme-secondary font-medium whitespace-nowrap select-none transition-all"
                        style={{ left: `${index * 12}px` }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-[2px]">
                    {weeks.map((week, columnIndex) => (
                      <div key={columnIndex} className="flex flex-col gap-[2px]">
                        {Array.from({ length: 7 }).map((_, rowIndex) => {
                          const cell = week[rowIndex];
                          if (!cell) return <div key={rowIndex} className="w-[10px] h-[10px]" />;

                          return (
                            <button
                              key={cell.date}
                              onClick={() => setSelectedDate(cell.date)}
                              className={`w-[10px] h-[10px] rounded-[2px] border transition-all duration-200 focus:outline-none ${getCellIntensityClass(
                                cell.count
                              )} ${selectedDate === cell.date
                                  ? 'ring-1 ring-offset-1 ring-offset-black ring-blue-400 scale-110 z-10'
                                  : 'hover:scale-105 active:scale-95'
                                }`}
                              title={`${cell.date}: ${cell.count} Actions`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex justify-end items-center gap-1.5 pt-1 text-[9px] font-mono text-theme-muted select-none">
          <span>Less Logs</span>
          <div className="w-2.5 h-2.5 rounded-[1px] bg-zinc-900/40 border border-zinc-950" />
          <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-950/40 border border-blue-900/30" />
          <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-800/40 border border-blue-700/40" />
          <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-600/50 border border-blue-500/50" />
          <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-500" />
          <span>More Logs</span>
        </div>
      </div>

      {/* Forecast Block */}
      <div className="bg-zinc-900/10 border border-theme rounded-xl p-3.5 space-y-2.5">
        <h4 className="text-[10px] font-mono font-bold tracking-wider text-theme-secondary uppercase flex items-center gap-1.5">
          <Eye size={12} className="text-theme-muted" />
          Pipeline Schedule Forecast
        </h4>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="border-r border-zinc-900/60 py-1">
            <span className="block text-[9px] font-mono text-theme-muted uppercase">Revisions Due Tomorrow</span>
            <span className="text-sm font-bold text-blue-400 font-mono">+{metrics.dueTomorrowCount} Items</span>
          </div>
          <div className="py-1">
            <span className="block text-[9px] font-mono text-theme-muted uppercase">Scheduled This Week</span>
            <span className="text-sm font-bold text-zinc-300 font-mono">{metrics.dueNextWeekCount} Total</span>
          </div>
        </div>
      </div>

      {/* Daily Ledger Details */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-theme p-2 border border-theme rounded-lg">
          <button
            onClick={() => handleStepDate(-1)}
            className="p-1 text-theme-secondary hover:text-zinc-200 hover:bg-zinc-900 rounded-md transition-all active:scale-95"
          >
            <ChevronLeft size={16} />
          </button>

          <h3 className="text-xs font-bold tracking-wider font-mono text-zinc-200 uppercase flex items-center gap-2">
            {isLoadingActivity && <Loader2 size={10} className="animate-spin text-theme-muted" />}
            {formatDisplayDate(selectedDate)}
          </h3>

          <button
            onClick={() => handleStepDate(1)}
            disabled={selectedDate === todayStr}
            className="p-1 text-theme-secondary hover:text-zinc-200 hover:bg-zinc-900 rounded-md transition-all disabled:opacity-20 disabled:hover:bg-transparent active:scale-95"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {activeDayDetails.dailyLog || activeDayDetails.revisionLogs.length > 0 ? (
          <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
            {activeDayDetails.dailyLog && (
              <div className="bg-theme-card border border-theme rounded-xl p-4 space-y-3.5 shadow-sm transition-all">
                <div className="flex justify-between items-center border-b border-theme pb-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Terminal size={14} />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Daily Saved Input</span>
                  </div>
                  <span className="text-[9px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 shadow-sm">
                    Active Raw Log
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] uppercase tracking-wider font-mono text-theme-muted">Input Text Saved:</span>
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900/80 italic select-text">
                    "{activeDayDetails.dailyLog.rawInput}"
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/40">
                  <div className="flex items-center gap-1.5 text-theme-secondary text-[10px] font-mono uppercase tracking-wide">
                    <Cpu size={12} className="text-blue-400" />
                    Status:
                  </div>
                  <span className="text-[10px] font-mono text-zinc-200 font-medium">{activeDayDetails.dailyLog.status}</span>
                </div>
                
                {/* Concept Interactive Workspace */}
                <div className="space-y-3 pt-1">
                  <span className="block text-[9px] uppercase tracking-wider font-mono text-theme-muted">Topics Extracted:</span>
                  
                  <div className="flex flex-wrap gap-1.5 min-h-[28px] transition-all duration-300">
                    {localTopics.length > 0 ? (
                      localTopics.map((topic, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-1.5 text-[10px] font-mono bg-blue-950/40 text-blue-400 border border-blue-900/40 pl-2.5 pr-1.5 py-0.5 rounded-md hover:border-blue-700/60 transition-all shadow-sm group animate-[fadeIn_0.15s_ease-out]"
                        >
                          <span>{topic}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveTopic(topic)}
                            className="p-0.5 text-blue-400/50 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title={`Remove ${topic}`}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] text-theme-muted font-mono italic self-center animate-[fadeIn_0.15s_ease-out]">No structural study topics mapped yet.</span>
                    )}
                  </div>

                  {/* Excluded/Deleted Topics Section */}
                  <div className="space-y-2 pt-1 border-t border-zinc-900/40">
                    <span className="block text-[9px] uppercase tracking-wider font-mono text-theme-muted">Topics Excluded:</span>
                    <div className="flex flex-wrap gap-1.5 min-h-[28px] transition-all duration-300">
                      {localDeletedTopics.length > 0 ? (
                        localDeletedTopics.map((topic, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-1.5 text-[10px] font-mono bg-red-950/40 text-red-400 border border-red-900/40 pl-2.5 pr-1.5 py-0.5 rounded-md hover:border-red-700/60 transition-all shadow-sm group animate-[fadeIn_0.15s_ease-out]"
                          >
                            <span>{topic}</span>
                            <button 
                              type="button"
                              onClick={() => handleRestoreTopic(topic)}
                              className="p-0.5 text-red-400/50 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                              title={`Restore ${topic}`}
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-theme-muted font-mono italic self-center animate-[fadeIn_0.15s_ease-out]">No excluded study nodes.</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-zinc-900/60">
                    <form onSubmit={handleAddTopicSubmit} className="flex items-center gap-1.5 flex-1 max-w-sm">
                      <input 
                        type="text"
                        value={newTopicInput}
                        onChange={(e) => setNewTopicInput(e.target.value)}
                        placeholder="Add revision node..."
                        className="w-full text-[10px] font-mono bg-zinc-950 border border-theme rounded-md px-2 py-1 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all select-text"
                      />
                      <button
                        type="submit"
                        className="flex items-center justify-center p-1 rounded-md bg-zinc-900 text-zinc-400 border border-theme hover:bg-blue-950/40 hover:text-blue-400 hover:border-blue-900/50 transition-all shrink-0 active:scale-95"
                        title="Add local topic configuration"
                      >
                        <Plus size={12} />
                      </button>
                    </form>

                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      disabled={!isSaveActiveAndValid}
                      className={`flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border transition-all duration-200 shrink-0 select-none ${saveButtonConfig.style}`}
                    >
                      {saveButtonConfig.icon}
                      <span>{saveButtonConfig.text}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeDayDetails.revisionLogs.length > 0 && (
              <div className="flex items-center gap-2 px-1 pt-2">
                <div className="h-1.5 w-full bg-blue-500 max-w-[6px] rounded-full" />
                <h3 className="text-[11px] font-semibold tracking-wide uppercase text-theme-muted">Concepts Revised</h3>
              </div>
            )}

            {activeDayDetails.revisionLogs.map((rev, index) => {
              const mastery = Math.min(100, Math.round(rev.masteryScore || 0));
              const isMastered = mastery >= 90;
              const memoryAge = Math.floor((new Date() - new Date(rev.createdAt)) / (1000 * 60 * 60 * 24));

              return (
                <div key={index} className="bg-theme-card border border-theme rounded-2xl px-4 py-3.5 space-y-3 shadow-sm hover:scale-[1.005] transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-theme-primary leading-snug">{rev.conceptName}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-theme-muted">
                        <span>{memoryAge}d active</span>
                        <span className="text-zinc-700">•</span>
                        <span>{rev.reviewCount}x</span>
                      </div>
                    </div>
                    <div className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${isMastered ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {mastery}%
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${isMastered ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${mastery}%` }} />
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[10px] text-theme-muted">
                        Next review: {new Date(rev.nextReviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-theme rounded-xl bg-theme-card transition-all">
            <p className="text-xs text-theme-muted font-mono">No raw data input logs or revisions recorded on this calendar matrix coordinate.</p>
          </div>
        )}
      </div>
    </div>
  );
}