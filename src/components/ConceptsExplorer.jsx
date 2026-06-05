import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConceptsExplorer({ revisionLogs = [], onBack }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortNewest, setSortNewest] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState(null);
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
    <AnimatePresence mode="wait">
      {selectedConcept ? (
        // DETAIL VIEW
        <motion.div
          key="detail"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 50, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xs mx-auto py-6 px-1"
        >
          <button onClick={() => setSelectedConcept(null)} className="text-zinc-500 hover:text-white mb-10 transition-all active:scale-90">
            <ArrowLeft size={16} />
          </button>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-s3 text-white font-medium mb-1">{selectedConcept.conceptName}</h2>
              <div className="text-s0 text-zinc-500 font-mono tracking-wider">
                MASTERY: <span className="text-zinc-300">{selectedConcept.masteryScore}%</span>
              </div>
            </div>
            
            <p className="text-s1 text-zinc-400 leading-relaxed">
              {selectedConcept.notes || "No detailed notes recorded for this study node."}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
              <div>
                <div className="text-s0 text-zinc-600 uppercase tracking-widest font-bold">Revisions</div>
                <div className="text-s1 text-zinc-300 mt-1">{selectedConcept.reviewCount}</div>
              </div>
              <div>
                <div className="text-s0 text-zinc-600 uppercase tracking-widest font-bold">Created</div>
                <div className="text-s1 text-zinc-300 mt-1">
                  {new Date(selectedConcept.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        // EXPLORER LIST VIEW
        <motion.div
          key="list"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xs mx-auto py-6"
        >
          <nav className="flex justify-between items-center mb-10">
            <button onClick={onBack} className="text-zinc-500 hover:text-white transition-all active:scale-90">
              <ArrowLeft size={22} />
            </button>
            <button onClick={() => setSortNewest(!sortNewest)} className="text-s1 uppercase tracking-[0.25em] text-zinc-400 font-bold">
              {sortNewest ? 'Newest' : 'Older'}
            </button>
          </nav>

          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search..."
            className="w-full bg-transparent border-b border-zinc-700 pb-2 text-s2 text-zinc-100 placeholder:text-zinc-800 focus:outline-none focus:border-zinc-500 transition-all"
          />

          <div className="mt-8 space-y-6 min-h-[220px]">
            {paginated.map((item, i) => (
              <div 
                key={`${item.conceptName}-${i}`} 
                onClick={() => setSelectedConcept(item)}
                className="flex justify-between items-center group cursor-pointer hover:translate-x-1 transition-all"
              >
                <div className="truncate pr-4">
                  <div className="text-s3 text-zinc-300 group-hover:text-white truncate">{item.conceptName}</div>
                  <div className="text-s1 text-zinc-600 font-mono mt-0.5">{item.reviewCount} REVISIONS</div>
                </div>
                <div className="text-s2 text-zinc-500 font-mono group-hover:text-zinc-300">{item.masteryScore}%</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}