import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Flame, Layers, CheckCircle2, Trophy, Activity, ChevronLeft, ChevronRight, Eye, Cpu, Terminal, Loader2 } from 'lucide-react';
import { dashboardService } from '../api/dashboardService';

export default function DashboardScreen() {
  const heatmapScrollContainerRef = useRef(null);

  // Dynamic System Date Anchor Context
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Real State management slots
  const [heatmapData, setHeatmapData] = useState({});
  const [metrics, setMetrics] = useState({
    currentStreak: 0,
    totalConceptsCount: 0,
    averageMasteryScore: 0,
    dueTomorrowCount: 0,
    dueNextWeekCount: 0
  });
  const [activeDayDetails, setActiveDayDetails] = useState({ dailyLog: null, revisionLogs: [] });
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Sync selected date if the actual system day flips
  useEffect(() => {
    setSelectedDate(todayStr);
  }, [todayStr]);

  // =============== FLOW ENGINE 1: FETCH HEATMAP & METRICS ===============
  useEffect(() => {
    async function loadCoreDashboardData() {
      try {
        setIsLoadingHeatmap(true);
        const [heatmapRes, metricsRes] = await Promise.all([
          dashboardService.getHeatmap(),
          dashboardService.getMetrics()
        ]);
        setHeatmapData(heatmapRes);
        setMetrics(metricsRes);
      } catch (error) {
        console.error("Failed to load dashboard metrics matrix maps", error);
      } finally {
        setIsLoadingHeatmap(false);
      }
    }
    loadCoreDashboardData();
  }, [todayStr]);

  // =============== FLOW ENGINE 2: FETCH ACTIVITY DETAILS FOR CELL ===============
  useEffect(() => {
    async function loadDateDetails() {
      try {
        setIsLoadingActivity(true);
        const data = await dashboardService.getActivityDetails(selectedDate);

        setActiveDayDetails({
          dailyLog: data.dailyLogs && data.dailyLogs.length > 0 ? data.dailyLogs[0] : null,
          revisionLogs: data.revisionLogs || []
        });
      } catch (error) {
        console.error(`Failed to fetch production activity payload for timestamp: ${selectedDate}`, error);
        setActiveDayDetails({ dailyLog: null, revisionLogs: [] });
      } finally {
        setIsLoadingActivity(false);
      }
    }
    loadDateDetails();
  }, [selectedDate]);

  // Build Structural Matrix Cells directly mapping against live backend states
  const heatmapCells = useMemo(() => {
    const cells = [];
    const [year, month, day] = todayStr.split('-').map(Number);

    for (let i = 364; i >= 0; i--) {
      const targetDate = new Date(year, month - 1, day);
      targetDate.setDate(targetDate.getDate() - i);

      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      cells.push({
        date: dateStr,
        count: heatmapData[dateStr] || 0
      });
    }
    return cells;
  }, [heatmapData, todayStr]);

  // Anchor Heatmap Scroll position matching element offsets
  useEffect(() => {
    if (heatmapScrollContainerRef.current && !isLoadingHeatmap) {
      const container = heatmapScrollContainerRef.current;
      container.scrollLeft = container.scrollWidth;
    }
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
    <div className="space-y-6 animate-[fadeIn_0.15s_ease-out] pb-12 text-zinc-100 max-w-4xl mx-auto">

      {/* Structural Header */}
      <div className="border-b border-zinc-800/60 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <Activity size={18} className="text-blue-500 shrink-0" />
          <span>Retention Engine Dashboard</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">Tracking automated concept extraction and memory review logs.</p>
      </div>

      {/* Analytical Metric Grid Components */}
      <div className="grid grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between h-24">
          <div className="flex items-center gap-2 text-zinc-400">
            <Flame size={15} className="text-blue-500 shrink-0" />
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono truncate">Streak</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-zinc-100">{metrics.currentStreak}</span>
            <span className="text-[10px] font-medium text-zinc-500 uppercase">days</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between h-24">
          <div className="flex items-center gap-2 text-zinc-400">
            <Layers size={15} className="text-blue-400 shrink-0" />
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono truncate">Concepts</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-zinc-100">{metrics.totalConceptsCount}</span>
            <span className="text-[10px] font-medium text-zinc-500 uppercase">items</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between h-24">
          <div className="flex items-center gap-2 text-zinc-400">
            <Trophy size={15} className="text-emerald-400 shrink-0" />
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono truncate">Mastery</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono text-zinc-100">{metrics.averageMasteryScore}</span>
            <span className="text-[10px] font-medium text-zinc-500">%</span>
          </div>
        </div>
      </div>

      {/* Contribution Grid Layout Block */}
      <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-inner">
        <div className="flex justify-between items-center text-[10px] font-mono tracking-wider text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} className="text-zinc-500" />
            365-Day Engineering Log Matrix
          </span>
          {isLoadingHeatmap && (
            <span className="flex items-center gap-1 text-[9px] text-blue-400 font-mono">
              <Loader2 size={10} className="animate-spin" /> Syncing Matrix...
            </span>
          )}
        </div>

        {/* Dense Heatmap Scroll Box - Anchored Far Right */}
        <div
          ref={heatmapScrollContainerRef}
          className="overflow-x-auto pb-2 pt-1 -mx-2 px-2 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-800"
        >
          <div className="grid grid-flow-col grid-rows-7 gap-[3px] w-max">
            {heatmapCells.map((cell) => (
              <button
                key={cell.date}
                onClick={() => setSelectedDate(cell.date)}
                className={`w-[10px] h-[10px] rounded-[1.5px] border transition-all duration-100 focus:outline-none ${getCellIntensityClass(cell.count)} ${selectedDate === cell.date ? 'ring-1 ring-offset-1 ring-offset-black ring-blue-400 scale-110 z-10' : 'hover:scale-105'
                  }`}
                title={`${cell.date}: ${cell.count} Actions`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end items-center gap-1.5 pt-1 text-[9px] font-mono text-zinc-500">
          <span>Less Logs</span>
          <div className="w-2.5 h-2.5 rounded-[1px] bg-zinc-900/40 border border-zinc-950" />
          <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-950/40 border border-blue-900/30" />
          <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-800/40 border border-blue-700/40" />
          <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-600/50 border border-blue-500/50" />
          <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-500" />
          <span>More Logs</span>
        </div>
      </div>

      {/* Memory Retention Forecast Panel */}
      <div className="bg-zinc-900/10 border border-zinc-800/60 rounded-xl p-3.5 space-y-2.5">
        <h4 className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
          <Eye size={12} className="text-zinc-500" />
          Pipeline Schedule Forecast
        </h4>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="border-r border-zinc-900/60 py-1">
            <span className="block text-[9px] font-mono text-zinc-500 uppercase">Revisions Due Tomorrow</span>
            <span className="text-sm font-bold text-blue-400 font-mono">+{metrics.dueTomorrowCount} Items</span>
          </div>
          <div className="py-1">
            <span className="block text-[9px] font-mono text-zinc-500 uppercase">Scheduled This Week</span>
            <span className="text-sm font-bold text-zinc-300 font-mono">{metrics.dueNextWeekCount} Total</span>
          </div>
        </div>
      </div>

      {/* Step Navigation Header & Clean Single-Date Ledger */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-zinc-950 p-2 border border-zinc-900 rounded-lg">
          <button
            onClick={() => handleStepDate(-1)}
            className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-md transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <h3 className="text-xs font-bold tracking-wider font-mono text-zinc-200 uppercase flex items-center gap-2">
            {isLoadingActivity && <Loader2 size={10} className="animate-spin text-zinc-500" />}
            {formatDisplayDate(selectedDate)}
          </h3>

          <button
            onClick={() => handleStepDate(1)}
            disabled={selectedDate === todayStr}
            className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-md transition-colors disabled:opacity-20 disabled:hover:bg-transparent"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Activities Content Container */}
        {(activeDayDetails.dailyLog || activeDayDetails.revisionLogs.length > 0) ? (
          <div className="space-y-4">

            {/* TYPE 1: SPECIFIC DAILY LOG VIEW */}
            {activeDayDetails.dailyLog && (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3.5">
                <div className="flex justify-between items-center border-b border-zinc-800/60 pb-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Terminal size={14} />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Daily Saved Input</span>
                  </div>
                  <span className="text-[9px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 shadow-sm">
                    Active Raw Log
                  </span>
                </div>

                {/* Info Block A: User Input Text */}
                <div className="space-y-1">
                  <span className="block text-[9px] uppercase tracking-wider font-mono text-zinc-500">Input Text Saved:</span>
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-900/80 italic">
                    "{activeDayDetails.dailyLog.rawInput}"
                  </p>
                </div>

                {/* Info Block B: Extraction Pipeline Status */}
                <div className="flex items-center gap-3 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/40">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-mono uppercase tracking-wide">
                    <Cpu size={12} className="text-blue-400" />
                    Status:
                  </div>
                  <span className="text-[10px] font-mono text-zinc-200 font-medium">
                    {activeDayDetails.dailyLog.status}
                  </span>
                </div>

                {/* Info Block C: Extracted Concepts */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] uppercase tracking-wider font-mono text-zinc-500">Topics Extracted:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeDayDetails.dailyLog.extractedTopics.map((topic, index) => (
                      <span
                        key={index}
                        className="text-[10px] font-mono bg-blue-950/40 text-blue-400 border border-blue-900/50 px-2 py-0.5 rounded-md"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TYPE 2: REVISION LOGS VIEW */}
  {activeDayDetails.revisionLogs.length > 0 && (
  <div className="flex items-center gap-2 px-1">
    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />

    <h3 className="text-[11px] font-semibold tracking-wide uppercase text-zinc-500">
      Concepts Revised
    </h3>
  </div>
)}

{activeDayDetails.revisionLogs.map((rev, index) => {

  const mastery = Math.min(
    100,
    Math.round(rev.masteryScore || 0)
  );

  const isMastered = mastery >= 90;

  const memoryAge = Math.floor(
    (new Date() - new Date(rev.createdAt)) /
    (1000 * 60 * 60 * 24)
  );

  return (
    <div
      key={index}
      className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl px-4 py-3.5 space-y-3"
    >

      {/* TOP */}
      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0 flex-1">

          <h4 className="text-sm font-medium text-zinc-100 leading-snug">
            {rev.conceptName}
          </h4>

         <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">

  <span>
    {memoryAge}d active
  </span>

  <span className="text-zinc-700">•</span>

  <span>
    {rev.reviewCount}x
  </span>

</div>
        </div>

        {/* Percentage */}
        <div
          className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${
            isMastered
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-blue-500/10 text-blue-400'
          }`}
        >
          {mastery}%
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">

        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">

          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isMastered
                ? 'bg-emerald-500'
                : 'bg-blue-500'
            }`}
            style={{
              width: `${mastery}%`
            }}
          />

        </div>

        <div className="flex justify-end">
  <span className="text-[10px] text-zinc-500">
    Next review:{" "}
    {new Date(rev.nextReviewDate).toLocaleDateString(
      'en-US',
      { month: 'short', day: 'numeric' }
    )}
  </span>
</div>
      </div>

    </div>
  );
})}

          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-zinc-800/80 rounded-xl bg-zinc-950/20">
            <p className="text-xs text-zinc-500 font-mono">No raw data input logs or revisions recorded on this calendar matrix coordinate.</p>
          </div>
        )}
      </div>

    </div>
  );
}