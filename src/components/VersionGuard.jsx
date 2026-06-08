import React from 'react';
import { ArrowUpRight, Orbit } from 'lucide-react';

export default function VersionGuard({ localVersion, latestVersion}) {
  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-[#ffffff] flex flex-col items-center justify-center p-8 select-none overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        
        {/* Core Engine Icon */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full animate-pulse" />
          <div className="relative h-24 w-24 rounded-[2rem] bg-zinc-900/40 border border-white/10 flex items-center justify-center backdrop-blur-md">
            <Orbit 
              size={42} 
              strokeWidth={1.2} 
              className="text-zinc-100 animate-[spin_10s_linear_infinite]" 
            />
          </div>
        </div>

        {/* Messaging */}
        <h1 className="text-2xl font-medium tracking-tight mb-3 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          Update Required
        </h1>
        
        <p className="text-[13px] text-zinc-500 leading-relaxed text-center mb-10 px-6 font-mono uppercase tracking-tight">
          A newer version of the engine is available. Update to sync your latest data and features.
        </p>

        {/* Interactive Button */}
        <a 
          href="https://drive.google.com/drive/folders/1mI_t7jWKKQYe87ivAm-ouAkX1FkbMJlW?usp=drive_link" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group flex items-center gap-3 py-4 px-10 rounded-full bg-white text-black text-xs font-bold transition-all hover:bg-zinc-200 active:scale-95 shadow-xl shadow-white/5 uppercase tracking-widest"
        >
          Get {latestVersion}
          <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>

        {/* Subtle version footer */}
        <div className="mt-16 flex flex-col items-center gap-2">
          <div className="h-[1px] w-8 bg-zinc-800" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-700 font-bold">
            Current: {localVersion}
          </span>
        </div>
        
      </div>
    </div>
  );
}