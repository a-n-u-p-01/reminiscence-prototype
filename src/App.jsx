import React, { useState, useEffect, useRef } from 'react';
import { Clock, BookOpen, Settings, Home as HomeIcon } from 'lucide-react';
import AuthPage from './pages/Auth';
import HomePage from './pages/Home';
import { useAuth } from './context/AuthContext';
import { noteService } from './api/noteService';
import ReviewScreen from './pages/ReviewScreen';
import DashboardScreen from './pages/DashboardScreen';
import SettingsScreen from './pages/SettingsScreen';
import PullToRefresh from 'react-simple-pull-to-refresh';


export default function App() {
  const { isAuthenticated } = useAuth();

  const mainContentRef = useRef(null);

  const [currentTab, setCurrentTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['home', 'dashboard', 'revision', 'settings'].includes(hash)
      ? hash
      : 'home';
  });

  const [globalCount, setGlobalCount] = useState(0);
  const [isCountLoaded, setIsCountLoaded] = useState(false);
  const [reviewConcepts, setReviewConcepts] = useState([]);
  const [isConceptsLoading, setIsConceptsLoading] = useState(false);
  const [hasFetchedRevision, setHasFetchedRevision] = useState(false);

  // =========================
  // NAVIGATION
  // =========================
  const navigateTo = (tab) => {
    window.location.hash = tab;
    setCurrentTab(tab);

    // Safe scroll reset (Capacitor friendly)
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }

    window.scrollTo(0, 0);
  };


  // =========================
  // HASH ROUTING SYNC
  // =========================
  useEffect(() => {
    const sanitizeAndRoute = () => {
      const rawHash = window.location.hash.replace('#', '');

      if (!rawHash) {
        setCurrentTab('home');
        return;
      }

      const validTabs = ['home', 'dashboard', 'revision', 'settings'];

      if (validTabs.includes(rawHash)) {
        setCurrentTab(rawHash);
      } else {
        setCurrentTab('home');
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    sanitizeAndRoute();

    window.addEventListener('hashchange', sanitizeAndRoute);
    return () => window.removeEventListener('hashchange', sanitizeAndRoute);
  }, []);

  // =========================
  // INITIAL COUNT LOAD
  // =========================
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchInitialCount = async () => {
      try {
        const count = await noteService.getPendingCount();
        setGlobalCount(count);
      } catch (err) {
        console.warn(err);
      } finally {
        setIsCountLoaded(true);
      }
    };

    fetchInitialCount();
  }, [isAuthenticated]);

  // =========================
  // REVISION LAZY LOAD
  // =========================
  useEffect(() => {
    if (
      currentTab !== 'revision' ||
      hasFetchedRevision ||
      isConceptsLoading
    ) return;

    const load = async () => {
      setIsConceptsLoading(true);

      try {
        const data = await noteService.getPendingConcepts();
        setReviewConcepts(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsConceptsLoading(false);
        setHasFetchedRevision(true);
      }
    };

    load();
  }, [currentTab, hasFetchedRevision, isConceptsLoading]);

  // =========================
  // REFRESH HANDLER
  // =========================
  const handleRefresh = async () => {
    const count = await noteService.getPendingCount();
    setGlobalCount(count);
    setReviewConcepts([]);
    setHasFetchedRevision(false);
  };

  const handleCardReviewed = (userConceptId) => {
    setReviewConcepts((prev) =>
      prev.filter((card) => card.userConceptId !== userConceptId)
    );
    setGlobalCount((prev) => Math.max(0, prev - 1));
  };

  // =========================
  // AUTH GATE
  // =========================
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={() => navigateTo('home')} />;
  }

  if (!isCountLoaded) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-mono text-xs tracking-wider animate-pulse">
        Initializing system...
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="flex flex-col flex-1 h-full w-full relative text-zinc-200 antialiased font-sans">

    <PullToRefresh
  onRefresh={handleRefresh}
  resistance={2.2}
  pullingContent={<div />}
  
>
        <main
          ref={mainContentRef}
          className="flex-1 overflow-y-auto px-5 pt-6 pb-24 scroll-smooth"
        >
          {currentTab === 'home' && (
            <HomePage
              pendingCount={globalCount}
              onNavigateToReview={() => navigateTo('revision')}
              onNoteLogged={handleRefresh}
            />
          )}

          {currentTab === 'dashboard' && <DashboardScreen />}

          {currentTab === 'revision' && (
            <ReviewScreen
              concepts={reviewConcepts}
              loading={isConceptsLoading}
              onCardReviewed={handleCardReviewed}
              onSyncNeeded={() => {
                handleRefresh();
                navigateTo('home');
              }}
            />
          )}

          {currentTab === 'settings' && <SettingsScreen />}
        </main>

      </PullToRefresh>
      {/* Styled Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-[inherit] bg-zinc-950/80 backdrop-blur-md border-t border-zinc-900 h-18 flex justify-around items-center z-50 px-4 shadow-xl pb-2">
        <NavBtn
          active={currentTab === 'home'}
          onClick={() => navigateTo('home')}
          icon={HomeIcon}
          label="Home"
        />
        <NavBtn
          active={currentTab === 'dashboard'}
          onClick={() => navigateTo('dashboard')}
          icon={Clock}
          label="History"
        />

        {/* Custom badge logic button */}
        <button
          onClick={() => navigateTo('revision')}
          className={`flex flex-col items-center justify-center w-16 h-full transition-colors duration-150 relative ${currentTab === 'revision' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-400'
            }`}
        >
          <div className="relative p-1">
            <BookOpen size={20} />
            {globalCount > 0 && (
              <span className="absolute top-0 -right-2 bg-blue-500 text-white text-[9px] font-extrabold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-[#09090b] shadow-md animate-bounce">
                {globalCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Review</span>
        </button>

        <NavBtn
          active={currentTab === 'settings'}
          onClick={() => navigateTo('settings')}
          icon={Settings}
          label="Settings"
        />
      </nav>
    </div>
  );
}

// =========================
// NAV BUTTON
// =========================
function NavBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 h-full transition-colors duration-150 ${active ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-400'
        }`}
    >
      <Icon size={20} className="p-0.5" />
      <span className="text-[10px] font-medium tracking-tight mt-0.5">{label}</span>
    </button>
  );
}