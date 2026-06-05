import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

// Add this style block at the top level of your CSS or as a style tag
// .fade-in { animation: fadeIn 0.4s ease-out forwards; }
// @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

export default function ConceptsExplorer({ revisionLogs = [], onBack }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortNewest, setSortNewest] = useState(true);
  const LIMIT = 10;

  const filtered = useMemo(() => {
    let result = revisionLogs.filter(r => 
      r.conceptName.toLowerCase().includes(search.toLowerCase())
    );
    return result.sort((a, b) => 
      sortNewest ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );
  }, [revisionLogs, search, sortNewest]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = useMemo(() => 
    filtered.slice((page - 1) * LIMIT, page * LIMIT), 
  [filtered, page]);

  return (
    // Added 'fade-in' class to handle smooth entry
    <div className="max-w-xs mx-auto py-8 px-5 fade-in">
      <nav className="flex justify-between items-center mb-10">
        <button 
          onClick={onBack} 
          className="text-zinc-500 hover:text-white transition-all duration-300 active:scale-90"
        >
          <ArrowLeft size={16} />
        </button>
        <button 
          onClick={() => setSortNewest(!sortNewest)}
          className="text-[9px] uppercase tracking-[0.25em] text-zinc-700 hover:text-zinc-400 font-bold transition-colors"
        >
          {sortNewest ? 'Newest First' : 'Older First'}
        </button>
      </nav>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search..."
        className="w-full bg-transparent border-b border-zinc-700 pb-2 text-sm text-zinc-100 placeholder:text-zinc-800 focus:outline-none focus:border-zinc-500 transition-all duration-300"
      />

      {/* Added transition-all to container for smooth re-rendering */}
      <div className="mt-8 space-y-6 min-h-[220px] transition-all duration-500">
        {paginated.map((item, i) => (
          <div 
            key={`${item.conceptName}-${i}`} 
            className="flex justify-between items-center group cursor-pointer transition-all duration-300 hover:translate-x-1"
          >
            <div className="truncate pr-4">
              <div className="text-[13px] text-zinc-300 group-hover:text-white transition-colors duration-300 truncate">
                {item.conceptName}
              </div>
              <div className="text-[9px] text-zinc-600 font-mono mt-0.5 tracking-tight">
                {item.reviewCount} {item.reviewCount === 1 ? 'REVISION' : 'REVISIONS'}
              </div>
            </div>
            <div className="text-[12px] text-zinc-500 font-mono tabular-nums transition-colors duration-300 group-hover:text-zinc-300">
              {item.masteryScore}%
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-zinc-900">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1}
            className="text-zinc-600 hover:text-white disabled:opacity-20 transition-all duration-300 active:scale-90"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[9px] font-mono text-zinc-700">{page} / {totalPages}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            disabled={page === totalPages}
            className="text-zinc-600 hover:text-white disabled:opacity-20 transition-all duration-300 active:scale-90"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}