import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dashboardService } from '../api/dashboardService';
import ConceptDetail from './ConceptDetail';

export default function ConceptsExplorer({ onBack }) {
  const [concepts, setConcepts] = useState([]);
  const [search, setSearch] = useState('');
  
  // Authoritative query state that actually triggers the API side effect
  const [activeQuery, setActiveQuery] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortNewest, setSortNewest] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Unified Trigger for explicit submissions (Button click or Enter Key)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault(); 
    setPage(1);                 // Force reset to page 1 on a fresh query criteria
    setActiveQuery(search);     // This change will wake up the fetching useEffect
  };

  // 2. Fetch server-side concepts dataset (Fires ONLY on page, sort, or explicit activeQuery changes)
  useEffect(() => {
    let isMounted = true;

    async function fetchServerData() {
      setIsLoading(true);
      try {
        const response = await dashboardService.getConceptsExplorer(page, activeQuery, sortNewest);
        if (isMounted) {
          setConcepts(response.data || []);
          setTotalPages(response.totalPages || 1);
        }
      } catch (error) {
        console.error("Failed fetching concepts matrix chunk:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchServerData();
    return () => { isMounted = false; };
  }, [page, activeQuery, sortNewest]);

  return (
    <AnimatePresence mode="wait">
      {selectedConcept ? (
        // DETAIL VIEW CONTAINER
        <motion.div
          key="detail"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 50, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xs mx-auto py-6 px-1"
        >
          <ConceptDetail concept={selectedConcept} onBack={() => setSelectedConcept(null)} />
        </motion.div>
      ) : (
        // EXPLORER LIST VIEW CONTAINER
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
            <button 
              onClick={() => { setSortNewest(!sortNewest); setPage(1); }} 
              className="text-s1 uppercase tracking-[0.25em] text-zinc-400 font-bold"
            >
              {sortNewest ? 'Newest' : 'Older'}
            </button>
          </nav>

          {/* Form wrapper catches explicit click and native keyboard enter submissions */}
          {/* <form onSubmit={handleSearchSubmit} className="relative flex items-center border-b border-zinc-700 focus-within:border-zinc-500 transition-all group">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent pb-2 pr-8 text-s2 text-zinc-100 placeholder:text-zinc-800 focus:outline-none transition-all"
            />
            <button 
              type="submit"
              className="absolute right-0 bottom-2 text-zinc-600 hover:text-zinc-300 transition-colors active:scale-90"
              aria-label="Execute Search"
            >
              <Search size={16} />
            </button>
          </form> */}

          {/* List items map container */}
          <div className={`mt-8 space-y-6 min-h-[220px] transition-opacity duration-200 ${isLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {concepts.length === 0 ? (
              <div className="text-s1 text-zinc-600 font-mono py-4 text-center">NO MATCHES FOUND</div>
            ) : (
              concepts.map((item, i) => (
                <div 
                  key={`${item.conceptId || item.conceptName}-${i}`} 
                  onClick={() => setSelectedConcept(item)}
                  className="flex justify-between items-center group cursor-pointer hover:translate-x-1 transition-all"
                >
                  <div className="truncate pr-4">
                    <div className="text-s3 text-zinc-300 group-hover:text-white truncate">
                      {item.conceptName}
                    </div>
                    {/* CHANGED: Replaced revision counts with formatted dynamic creation date */}
                    <div className="text-s1 text-zinc-600 font-mono mt-0.5 uppercase tracking-wider">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className="text-s2 text-zinc-500 font-mono group-hover:text-zinc-300">
                    {item.masteryScore}%
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Navigation Elements */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-10 pt-4 border-t border-zinc-900 font-mono text-s1 text-zinc-500">
              <button 
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(prev => prev - 1)}
                className="flex items-center space-x-1 disabled:opacity-20 active:scale-95 transition-all text-zinc-400 hover:text-white"
              >
                <ChevronLeft size={16} />
                <span>PREV</span>
              </button>
              
              <span className="text-zinc-600 text-s0 tracking-widest uppercase">
                {page} / {totalPages}
              </span>

              <button 
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(prev => prev + 1)}
                className="flex items-center space-x-1 disabled:opacity-20 active:scale-95 transition-all text-zinc-400 hover:text-white"
              >
                <span>NEXT</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}