import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
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

  useEffect(() => {
    const syncRoute = () => {
      const hash = window.location.hash.replace('#', '');

      if (hash === 'dashboard/concepts') {
        setSelectedConcept(null);
      }
    };

    window.addEventListener('hashchange', syncRoute);

    return () => {
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  // Unified Trigger for explicit submissions (Button click or Enter Key)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault(); 
    setPage(1);                 // Force reset to page 1 on a fresh query criteria
    setActiveQuery(search);     // This change will wake up the fetching useEffect
  };

  // Fetch server-side concepts dataset (Fires ONLY on page, sort, or explicit activeQuery changes)
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

  // Native Mobile Velocity Timing Curves
  const mobileTransition = { 
    duration: 0.2, 
    ease: [0.16, 1, 0.3, 1] 
  };

  return (
    <AnimatePresence mode="wait">
      {selectedConcept ? (
        // DETAIL VIEW CONTAINER MATCHING SYSTEM WIDTH
        <motion.div
          key="detail"
          initial={{ x: 16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 16, opacity: 0 }}
          transition={mobileTransition}
          /* Added max-w-xl mx-auto to center and match system profile layout standards */
          className="w-full max-w-xl mx-auto pb-20 space-y-6 touch-pan-y will-change-transform active:cursor-grabbing select-none"
        >
          <ConceptDetail concept={selectedConcept} onBack={() => window.history.back()}/>
        </motion.div>
      ) : (
        // EXPLORER LIST VIEW CONTAINER MATCHING SYSTEM WIDTH
        <motion.div
          key="list"
          initial={{ x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -16, opacity: 0 }}
          transition={mobileTransition}
          /* Added max-w-xl mx-auto to prevent infinite horizontal stretching on laptops */
          className="w-full max-w-xl mx-auto pb-20 space-y-6 touch-pan-y relative will-change-transform active:cursor-grabbing select-none"
        >
          {/* Structural Header Layout - Matches Settings Screen Alignment perfectly */}
          <div className="border-b border-zinc-800/60 pb-5 flex items-center justify-between gap-4 min-h-[56px] pointer-events-auto">
            <div className="flex items-center gap-2.5">
              <button onClick={onBack} className="text-zinc-500 hover:text-white transition-colors active:scale-90 p-1 -ml-1 rounded-md shrink-0">
                <ArrowLeft size={22} />
              </button>
              <h1 className="font-semibold tracking-tight text-zinc-100 text-s4">
                Concepts Explorer
              </h1>
            </div>
            
            <button 
              onClick={() => { setSortNewest(!sortNewest); setPage(1); }} 
              className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold bg-zinc-950 border border-zinc-800/80 hover:bg-zinc-900 px-3 py-1.5 rounded-lg transition-all"
            >
              {sortNewest ? 'Newest' : 'Older'}
            </button>
          </div>

          {/* Minimal Micro-Loading Bar */}
          <div className="absolute top-[55px] left-0 right-0 h-[1px] bg-zinc-900 overflow-hidden">
            {isLoading && (
              <motion.div 
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-zinc-400 to-transparent"
              />
            )}
          </div>

          {/* List Matrix Display Container (Now fills out the layout width cleanly) */}
          <div className={`bg-zinc-900/20 border border-zinc-800/60 rounded-xl px-4 divide-y divide-zinc-800/40 min-h-[220px] transition-all duration-150 pointer-events-auto ${isLoading ? 'opacity-50 pointer-events-none filter blur-[0.3px]' : 'opacity-100'}`}>
            {concepts.length === 0 ? (
              <div className="text-s1 text-zinc-600 font-mono py-12 text-center tracking-widest">
               {isLoading? "Loading...":"NO MATCHES FOUND"} 
              </div>
            ) : (
              concepts.map((item, i) => (
                <div 
                  key={`${item.conceptId || item.conceptName}-${i}`} 
                  onClick={() => {
                    window.history.pushState(
                      null,
                      '',
                      `#dashboard/concepts/${item.conceptId}`
                    );

                    setSelectedConcept(item);
                  }}
                  className="flex justify-between items-center group cursor-pointer py-3.5 bg-transparent transition-all active:translate-x-0.5"
                >
                  <div className="truncate pr-4 space-y-0.5">
                    <div className="text-s3 font-medium text-zinc-300 group-hover:text-blue-400 transition-colors duration-150 truncate">
                      {item.conceptName}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className="text-s1 text-zinc-300 font-mono bg-zinc-950 border border-zinc-800/60 group-hover:border-zinc-700/80 px-2.5 py-1 rounded-md transition-colors shrink-0">
                    {item.masteryScore}%
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Navigation Elements */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-2 font-mono text-s1 text-zinc-500 pointer-events-auto">
              <button 
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage(prev => prev - 1)}
                className="flex items-center space-x-1 bg-zinc-950 border border-zinc-800/80 p-2 rounded-lg disabled:opacity-20 active:scale-95 transition-all text-zinc-400 hover:text-white"
              >
                <ChevronLeft size={14} />
                <span className="px-1 text-[10px] font-bold">PREV</span>
              </button>
              
              <span className="text-zinc-500 text-s1 font-bold bg-zinc-900/40 border border-zinc-800/40 px-3 py-1.5 rounded-lg tracking-widest">
                {page} / {totalPages}
              </span>

              <button 
                type="button"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage(prev => prev + 1)}
                className="flex items-center space-x-1 bg-zinc-950 border border-zinc-800/80 p-2 rounded-lg disabled:opacity-20 active:scale-95 transition-all text-zinc-400 hover:text-white"
              >
                <span className="px-1 text-[10px] font-bold">NEXT</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}