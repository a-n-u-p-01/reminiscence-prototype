import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, RotateCw } from 'lucide-react';

export default function StatusCapsule({ message, type = 'success' }) {
  // Local state to cache the last active message details during the exit transition
  const [displayState, setDisplayState] = useState({ text: '', type: 'success' });

  useEffect(() => {
    if (message) {
      // If message is a string object, pass it directly; otherwise parse it
      const text = typeof message === 'string' ? message : message.text;
      setDisplayState({ text, type });
    }
  }, [message, type]);

  // Choose configurations dynamically based on type
  const config = {
    success: {
      border: 'border-emerald-500/30 text-emerald-400',
      icon: <CheckCircle size={12} className="text-emerald-400" />
    },
    error: {
      border: 'border-red-500/30 text-red-400',
      icon: <AlertCircle size={12} className="text-red-400" />
    },
    warn: {
      border: 'border-amber-500/30 text-amber-400',
      icon: <AlertTriangle size={12} className="text-amber-400" />
    },
    sync: {
      border: 'border-blue-500/30 text-blue-400',
      icon: <RotateCw size={12} className="text-blue-400 animate-spin" />
    }
  }[displayState.type] || {
    border: 'border-emerald-500/30 text-emerald-400',
    icon: <CheckCircle size={12} className="text-emerald-400" />
  };

  return (
    /* 🔑 Centering Wrapper: Stays statically aligned perfectly in the center at all times */
    <div
      style={{ top: 'calc(0.35rem + env(safe-area-inset-top, 0px))' }}
      className="fixed left-1/2 -translate-x-1/2 z-[100] pointer-events-none flex justify-center w-full max-w-xs"
    >
      {/* 🔑 Animation Target: Handles only opacity, y-axis travel, and scaling changes */}
      <div
        className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          message
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-4 scale-95'
        }`}
      >
        <div className={`bg-theme-card backdrop-blur-md border rounded-full px-3.5 py-1.5 flex items-center gap-2 shadow-2xl ${config.border}`}>
          <div className="shrink-0 flex items-center justify-center">
            {config.icon}
          </div>
          <span className="text-[10px] font-mono font-medium tracking-wider text-zinc-300 uppercase whitespace-nowrap">
            {displayState.text}
          </span>
        </div>
      </div>
    </div>
  );
}