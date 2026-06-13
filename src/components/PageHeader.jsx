import React from 'react';
import { ArrowLeft } from 'lucide-react';

/**
 * Unified page header used across every screen so titles, icons, subtitles and
 * actions are visually identical on mobile and desktop.
 *
 * Props:
 *  - icon:     lucide icon component shown in a tile (ignored when onBack is set)
 *  - title:    string
 *  - subtitle: optional string
 *  - actions:  optional node rendered on the right (buttons, badges, etc.)
 *  - onBack:   optional handler — renders a back button instead of the icon tile
 */
export default function PageHeader({ icon: Icon, title, subtitle, actions, onBack }) {
  return (
    <div className="border-b border-theme pb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="shrink-0 -ml-1 p-2 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-theme-card border border-transparent hover:border-theme transition-all active:scale-95"
          >
            <ArrowLeft size={18} className="stroke-[1.8]" />
          </button>
        ) : Icon ? (
          <div className="shrink-0 h-9 w-9 rounded-xl bg-theme-card border border-theme flex items-center justify-center text-theme-accent">
            <Icon size={17} className="stroke-[1.8]" />
          </div>
        ) : null}

        <div className="min-w-0">
          <h1 className="text-s5 font-semibold tracking-tight text-theme-primary truncate leading-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-s2 text-theme-muted truncate mt-0.5">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className="shrink-0 flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
