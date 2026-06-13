import React from 'react';
import { BookOpen, Flame, Trophy, Layers, CalendarClock, CheckCircle2, Target } from 'lucide-react';

/**
 * Desktop right rail (xl/2xl+). Two modes:
 *  - Study Companion (default): at-a-glance status + Start Review.
 *  - Focus mode (Review tab): a calm, button-free panel so it never distracts
 *    while the user is actually studying.
 *
 * All values come from data already loaded app-wide (DashboardContext.metrics +
 * ReviewContext.globalCount), so the rail is always safe to render.
 */

function Stat({ icon: Icon, label, value, accent = 'text-theme-accent' }) {
  return (
    <div className="flex-1 bg-theme border border-theme rounded-xl p-3 min-w-0">
      <div className="flex items-center gap-1.5 text-theme-muted">
        <Icon size={13} className={`${accent} shrink-0`} />
        <span className="text-[10px] font-mono uppercase tracking-wider truncate">{label}</span>
      </div>
      <div className="mt-1.5 text-xl font-bold font-mono text-theme-primary tabular-nums leading-none">
        {value}
      </div>
    </div>
  );
}

export default function StudyRail({ dueCount = 0, metrics = {}, onStartReview, focusMode = false }) {
  const m = metrics || {};

  if (focusMode) {
    return (
      <div className="w-full max-w-[300px] mx-auto h-full flex flex-col items-center justify-center text-center gap-4 select-none">
        <div className="h-14 w-14 rounded-2xl bg-theme-card border border-theme flex items-center justify-center text-theme-accent">
          <Target size={24} strokeWidth={1.6} />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-theme-primary tracking-tight">Focus mode</p>
          <p className="text-xs text-theme-muted leading-relaxed">
            Rate each card honestly and stay in flow. Your stats update when the session ends.
          </p>
        </div>
        {dueCount > 0 ? (
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-theme-muted/60">
            {dueCount} in queue
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[340px] mx-auto space-y-4 select-none">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-theme-muted px-1">
        At a glance
      </div>

      {/* Due today / Start review */}
      <div className="bg-theme-card border border-theme rounded-2xl p-5 shadow-sm">
        {dueCount > 0 ? (
          <>
            <div className="flex items-center gap-2 text-theme-accent">
              <BookOpen size={15} />
              <span className="text-[10px] font-mono uppercase tracking-widest">Due today</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold font-mono text-theme-primary tabular-nums leading-none">
                {dueCount}
              </span>
              <span className="text-xs text-theme-muted">{dueCount === 1 ? 'review' : 'reviews'}</span>
            </div>
            <button
              type="button"
              onClick={onStartReview}
              className="mt-4 w-full bg-blue-500 hover:bg-blue-400 text-white font-medium text-sm py-2.5 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <BookOpen size={14} />
              Start Review
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-2 gap-2">
            <CheckCircle2 size={22} className="text-emerald-400" />
            <p className="text-sm font-medium text-theme-primary">All caught up</p>
            <p className="text-xs text-theme-muted">No reviews due right now.</p>
          </div>
        )}
      </div>

      {/* Stat tiles */}
      <div className="flex gap-3">
        <Stat icon={Flame} label="Streak" value={m.currentStreak ?? 0} accent="text-orange-400" />
        <Stat icon={Trophy} label="Mastery" value={`${m.averageMasteryScore ?? 0}%`} accent="text-emerald-400" />
      </div>
      <div className="flex gap-3">
        <Stat icon={Layers} label="Concepts" value={m.totalConceptsCount ?? 0} />
        <Stat icon={CalendarClock} label="Tomorrow" value={`+${m.dueTomorrowCount ?? 0}`} />
      </div>

      {/* Up next */}
      <div className="bg-theme border border-theme rounded-xl p-3.5 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-theme-muted">This week</span>
        <span className="text-sm font-mono font-bold text-theme-primary tabular-nums">
          {m.dueNextWeekCount ?? 0} due
        </span>
      </div>
    </div>
  );
}
