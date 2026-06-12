import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dashboardService } from '../api/dashboardService';
import ConceptDetail from './ConceptDetail';
import { useDashboard } from '../context/DashboardContext';

export default function ConceptsExplorer({ onBack }) {
  const {
    isPullToRefresh,
    setIsPullToRefresh
  } = useDashboard();

  const [concepts, setConcepts] = useState([]);
  const [search, setSearch] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortNewest, setSortNewest] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync route layout matching hash conditions
  useEffect(() => {
    const syncRoute = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'dashboard/concepts') {
        setSelectedConcept(null);
      }
    };
    window.addEventListener('hashchange', syncRoute);
    return () => { window.removeEventListener('hashchange', syncRoute) };
  }, []);

  // Automatically reset search query and hit API when the input text is completely cleared
  useEffect(() => {
    if (search.trim() === '' && activeQuery !== '') {
      setPage(1);
      setActiveQuery('');
    }
  }, [search, activeQuery]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault(); 
    if (search.trim() === '') return; // Guard against hitting search on empty configurations manually
    setPage(1); 
    setActiveQuery(search); 
  };

  useEffect(() => {
    if (isPullToRefresh) {
      setPage(1);
    }
  }, [isPullToRefresh]);

  useEffect(() => {
    let isMounted = true;

    async function fetchServerData() {
      try {
        const targetPage = isPullToRefresh ? 1 : page;
        const response = await dashboardService.getConceptsExplorer(targetPage, activeQuery, sortNewest);
        
        if (isMounted) {
          setConcepts(response.data || []);
          setTotalPages(response.totalPages || 1);
        }
      } catch (error) {
        console.error("Failed fetching concepts matrix chunk:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          if (isPullToRefresh) {
            setIsPullToRefresh(false);
          }
        }
      }
    }

    setIsLoading(true);
    const delayDebounceIdx = setTimeout(() => fetchServerData(), 500);
    return () => { 
      isMounted = false; 
      clearTimeout(delayDebounceIdx);
    };
  }, [page, activeQuery, sortNewest, isPullToRefresh, setIsPullToRefresh, refreshTrigger]);

  const handleConceptDeletedEvent = (deletedId) => {
    setPage(1);
    setRefreshTrigger(prev => prev + 1);
    setSelectedConcept(null);
  };

  return (
    <AnimatePresence mode="wait">
      {selectedConcept ? (
        <motion.div
          key="detail"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="w-full max-w-xl lg:max-w-2xl mx-auto pb-20 space-y-6 touch-pan-y will-change-transform active:cursor-grabbing select-none"
        >
          <ConceptDetail 
            concept={selectedConcept} 
            onBack={() => window.history.back()}
            onDelete={handleConceptDeletedEvent}
            onSave={(updated) => {
              setSelectedConcept(updated);
              setRefreshTrigger(prev => prev + 1); 
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="w-full max-w-xl lg:max-w-2xl mx-auto pb-20 space-y-5 touch-pan-y relative will-change-transform active:cursor-grabbing select-none"
        >
          {/* Top Navbar */}
          <div className="border-b border-zinc-800/60 pb-5 flex items-center justify-between gap-4 min-h-[56px] pointer-events-auto">
            <div className="flex items-center gap-2.5">
              <button onClick={onBack} className="cursor-pointer text-zinc-500 hover:text-white transition-colors active:scale-90 p-1 -ml-1 rounded-md shrink-0">
                <ArrowLeft size={22} />
              </button>
              <h1 className="font-semibold tracking-tight text-zinc-100 text-s4">
                Concepts Explorer
              </h1>
            </div>
            
            <button 
              onClick={() => { setSortNewest(!sortNewest); setPage(1); }} 
              className="cursor-pointer text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold bg-zinc-950 border border-zinc-800/80 hover:bg-zinc-900 px-3 py-1.5 rounded-lg transition-all"
            >
              {sortNewest ? 'Newest' : 'Older'}
            </button>
          </div>

          {/* Search Row Component */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="group relative flex items-center bg-zinc-950/40 border border-zinc-800/60 focus-within:border-zinc-700/80 rounded-xl px-3 h-10 transition-all duration-200 pointer-events-auto"
          >
            <Search 
              size={15} 
              className="text-zinc-600 group-focus-within:text-zinc-400 transition-colors duration-200 shrink-0" 
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search concepts..."
              className="w-full h-full bg-transparent border-none outline-none focus:ring-0 px-3 text-[13px] text-zinc-200 placeholder-zinc-600 font-sans"
            />
            
            {/* Animated Submission Button Component */}
            <AnimatePresence>
              {search.trim().length > 0 && (
                <motion.button
                  key="submit-arrow"
                  type="submit"
                  initial={{ opacity: 0, scale: 0.8, x: 5 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 5 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="cursor-pointer flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 transition-colors active:scale-90 shrink-0"
                  aria-label="Execute search parameters"
                >
                  <ArrowRight size={13} />
                </motion.button>
              )}
            </AnimatePresence>
          </form>

          {/* Progress Activity Loader Bar */}
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

          {/* Concepts Resulting List Matrix */}
          <div className={`bg-zinc-900/20 border border-zinc-800/60 rounded-xl px-4 divide-y divide-zinc-800/40 min-h-sm transition-all duration-150 pointer-events-auto ${isLoading ? 'opacity-50 pointer-events-none filter blur-[0.3px]' : 'opacity-100'}`}>
            {concepts.length === 0 ? (
              <div className="text-s1 text-zinc-600 font-mono py-12 text-center tracking-widest uppercase">
                {isLoading ? "Loading..." : "NO MATCHES FOUND"} 
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

          {/* Pagination Operations Controls */}
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