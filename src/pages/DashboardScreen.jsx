import React, { useMemo, useRef, useEffect } from 'react';
import { Calendar, Flame, Layers, Trophy, Activity, ChevronLeft, ChevronRight, Eye, Cpu, Terminal, Loader2 } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext'; // Use the new context hook

export default function DashboardScreen() {
  const heatmapScrollContainerRef = useRef(null);

  // Destructure clean data matrices directly from the state architecture
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

  // Build GitHub-style Heatmap Cells
  const heatmapCells = useMemo(() => {
    const cells = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - 11);
    startDate.setDate(1);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const current = new Date(startDate);

    while (current <= new Date(today.getFullYear(), today.getMonth() + 1, 0)) {
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
    if (!heatmapScrollContainerRef.current || isLoadingHeatmap) return;
    const container = heatmapScrollContainerRef.current;
    requestAnimationFrame(() => {
      container.scrollTo({ left: container.scrollWidth, behavior: 'instant' });
    });
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

  return (
    <div className="space-y-6 animate-[fadeIn_0.15s_ease-out] pb-12 text-theme-primary max-w-4xl mx-auto">
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
        <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between h-24">
          <div className="flex items-center gap-2 text-theme-secondary">
            <Flame size={15} className="text-blue-500 shrink-0" />
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono truncate">Streak</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-theme-primary">{metrics.currentStreak}</span>
            <span className="text-[10px] font-medium text-theme-muted uppercase">days</span>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between h-24">
          <div className="flex items-center gap-2 text-theme-secondary">
            <Layers size={15} className="text-blue-400 shrink-0" />
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono truncate">Concepts</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-theme-primary">{metrics.totalConceptsCount}</span>
            <span className="text-[10px] font-medium text-theme-muted uppercase">items</span>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-xl p-4 flex flex-col justify-between h-24">
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
            <span className="flex items-center gap-1 text-[9px] text-blue-400 font-mono">
              <Loader2 size={10} className="animate-spin" /> Syncing Matrix...
            </span>
          )}
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-theme-card to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-theme-card to-transparent z-10" />

          <div
            ref={heatmapScrollContainerRef}
            className={`overflow-x-auto pb-2 pt-1 -mx-2 px-2 pr-2 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-800 transition-all duration-500 ${
              isLoadingHeatmap ? 'opacity-40 scale-[0.985]' : 'opacity-100 scale-100'
            }`}
          >
            {(() => {
              const weeks = [];
              for (let i = 0; i < heatmapCells.length; i += 7) {
                weeks.push(heatmapCells.slice(i, i + 7));
              }

              return (
                <div className="w-max space-y-1.5">
                  <div className="relative h-4 mb-1">
                    {weeks.map((week, index) => {
                      const firstCell = week[0];
                      if (!firstCell) return null;
                      const currentDate = new Date(firstCell.date);
                      const currentMonth = currentDate.getMonth();
                      const prevMonth = index > 0 ? new Date(weeks[index - 1][0].date).getMonth() : null;
                      if (currentMonth === prevMonth) return null;

                      return (
                        <span
                          key={index}
                          className="absolute text-[9px] text-theme-secondary font-medium whitespace-nowrap select-none"
                          style={{ left: `${index * 12}px` }}
                        >
                          {currentDate.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                      );
                    })}
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
                              )} ${
                                selectedDate === cell.date
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

        <div className="flex justify-end items-center gap-1.5 pt-1 text-[9px] font-mono text-theme-muted">
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
            className="p-1 text-theme-secondary hover:text-zinc-200 hover:bg-zinc-900 rounded-md transition-colors"
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
            className="p-1 text-theme-secondary hover:text-zinc-200 hover:bg-zinc-900 rounded-md transition-colors disabled:opacity-20 disabled:hover:bg-transparent"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {activeDayDetails.dailyLog || activeDayDetails.revisionLogs.length > 0 ? (
          <div className="space-y-4">
            {activeDayDetails.dailyLog && (
              <div className="bg-theme-card border border-theme rounded-xl p-4 space-y-3.5">
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
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900/80 italic">
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
                <div className="space-y-1.5">
                  <span className="block text-[9px] uppercase tracking-wider font-mono text-theme-muted">Topics Extracted:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeDayDetails.dailyLog.extractedTopics.map((topic, index) => (
                      <span key={index} className="text-[10px] font-mono bg-blue-950/40 text-blue-400 border border-blue-900/50 px-2 py-0.5 rounded-md">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeDayDetails.revisionLogs.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <h3 className="text-[11px] font-semibold tracking-wide uppercase text-theme-muted">Concepts Revised</h3>
              </div>
            )}

            {activeDayDetails.revisionLogs.map((rev, index) => {
              const mastery = Math.min(100, Math.round(rev.masteryScore || 0));
              const isMastered = mastery >= 90;
              const memoryAge = Math.floor((new Date() - new Date(rev.createdAt)) / (1000 * 60 * 60 * 24));

              return (
                <div key={index} className="bg-theme-card border border-theme rounded-2xl px-4 py-3.5 space-y-3">
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
          <div className="text-center py-12 border border-dashed border-theme rounded-xl bg-theme-card">
            <p className="text-xs text-theme-muted font-mono">No raw data input logs or revisions recorded on this calendar matrix coordinate.</p>
          </div>
        )}
      </div>
    </div>
  );
}