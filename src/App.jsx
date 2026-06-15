import React, { useState, useEffect, useRef } from 'react';
import { Clock, BookOpen, Settings, Home as HomeIcon, LayoutDashboard, Brain } from 'lucide-react';
import AuthPage from './pages/Auth';
import HomePage from './pages/Home';
import { useAuth } from './context/AuthContext';
import { useReviewEngine } from './context/ReviewContext';
import { useDashboard } from './context/DashboardContext';
import { useHomeEngine } from './context/HomeContext';
import ReviewScreen from './pages/ReviewScreen';
import DashboardScreen from './pages/DashboardScreen';
import SettingsScreen from './pages/SettingsScreen';

import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import StatusCapsule from './components/StatusCapsule';
import { useAppReset } from './hooks/useAppReset';

import { getItem, setItem } from '../src/storage/storageService';
import WelcomeSheet from './components/WelcomeSheet';
import VersionGuard from './components/VersionGuard';
import StudyRail from './components/StudyRail';
import { authService } from './api/authService';
import { usePushNotifications } from './hooks/pushNotificationService'; // <-- LINKED STANDALONE HOOK
import pkg from '../package.json';

const TAB_SEQUENCE = ['home', 'dashboard', 'revision', 'settings'];

function usePullToRefresh(
  scrollRef,
  onRefresh,
  pullDistance,
  setPullDistance,
  setPullMessage
) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef(0);
  const isPulling = useRef(false);
  const currentDistanceRef = useRef(0);

  useEffect(() => {
    currentDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const THRESHOLD = 52;

    const onTouchStart = (e) => {
      const targetTextarea = e.target.closest('textarea');
      if (targetTextarea && targetTextarea.scrollTop > 0) {
        return;
      }

      if (el.scrollTop === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (!isPulling.current || isRefreshing) return;

      const targetTextarea = e.target.closest('textarea');
      if (targetTextarea && targetTextarea.scrollTop > 0) {
        isPulling.current = false;
        setPullDistance(0);
        setPullMessage('');
        return;
      }

      const delta = Math.max(0, e.touches[0].clientY - startY.current);
      const damped = Math.min(55 * (1 - Math.exp(-delta / 55)), 55);

      setPullDistance(damped);

      if (damped > THRESHOLD) {
        setPullMessage('');
      } else if (damped > 18) {
        setPullMessage('Pull to refresh');
      } else {
        setPullMessage('');
      }
    };

    const onTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      const finalDistance = currentDistanceRef.current;

      if (finalDistance >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullMessage('');
        setPullDistance(0);

        try {
          await onRefresh();
        } catch (error) {
          console.error(error);
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
          }, 150);
        }
      } else {
        setPullDistance(0);
        setPullMessage('');
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [scrollRef, onRefresh, isRefreshing, setPullDistance, setPullMessage]);

  return isRefreshing;
}

export default function App() {
  // Destructured 'user' explicitly out of your global application context layer
  const { isAuthenticated, isDisconnecting, loading, user } = useAuth();
  const mainContentRef = useRef(null);
  const clearAppContext = useAppReset();
  const [pullDistance, setPullDistance] = useState(0);
  const [pullMessage, setPullMessage] = useState('');
  const [latestVersion, setlatestVersion] = useState('');

  const [showWelcome, setShowWelcome] = useState(false);
  const localVersion = pkg.version;

  const {
    globalCount,
    isCountLoaded,
    isManualRefreshing,
    handleSyncData,
    lazyLoadRevisionQueue
  } = useReviewEngine();

  const { refreshDashboard, metrics } = useDashboard();
  const { refreshHomeNote, statusMessage, setStatusMessage, setIsPullToRefresh } = useHomeEngine();

  const [currentTab, setCurrentTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return TAB_SEQUENCE.includes(hash) ? hash : 'home';
  });

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [backPressExitFlag, setBackPressExitFlag] = useState(false);

  // -----------------------------------------------------------------
  // RESPONSIVE LAYOUT: detect desktop (lg+) to swap the mobile slide
  // track for a sidebar-driven layout. Mobile/tablet stay untouched.
  // -----------------------------------------------------------------
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // -----------------------------------------------------------------
  // INITIALIZE PUSH SUB-ENGINE ON STARTUP
  // -----------------------------------------------------------------
  usePushNotifications(isAuthenticated, navigateTo);

  useEffect(() => {
    async function initOnboardingCheck() {
      try {
        const storedValue = await getItem('reminiscence_onboarding_acknowledged');
        if (storedValue !== 'true') {
          setShowWelcome(true);
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (isAuthenticated && isCountLoaded) {
      initOnboardingCheck();
    }
  }, [isAuthenticated, isCountLoaded]);

  const handleWelcomeComplete = async () => {
    try {
      await setItem('reminiscence_onboarding_acknowledged', 'true');
    } catch (err) {
      console.error(err);
    } finally {
      setShowWelcome(false);
    }
  };

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    const setupBackButtonLogic = async () => {
      const backListener = await CapacitorApp.addListener('backButton', () => {
        // If we're anywhere above the root entry (a deeper tab, a concept
        // sub-view, etc.), retrace the real history stack. hashchange then
        // re-syncs the active tab / sub-view automatically.
        const atRoot = !!(window.history.state && window.history.state.rmRoot);

        if (!atRoot) {
          window.history.back();
          return;
        }

        // At the home root → confirm exit with a second press.
        if (backPressExitFlag) {
          CapacitorApp.exitApp();
        } else {
          setBackPressExitFlag(true);

          if (setStatusMessage) {
            setStatusMessage({
              text: 'Press back again to close app',
              type: 'warn'
            });
          }

          setTimeout(() => {
            setBackPressExitFlag(false);
            if (setStatusMessage) {
              setStatusMessage(null);
            }
          }, 1500);
        }
      });
      return backListener;
    };

    const backButtonEventInstance = setupBackButtonLogic();
    return () => {
      backButtonEventInstance.then(listener => listener.remove());
    };
  }, [backPressExitFlag, setStatusMessage]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    Keyboard.setResizeMode({ mode: 'native' });

    const showListener = Keyboard.addListener('keyboardWillShow', () => setIsKeyboardVisible(true));
    const hideListener = Keyboard.addListener('keyboardWillHide', () => setIsKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  function navigateTo(tab) {
    // Push a REAL history entry (instead of replaceState) so the browser's
    // back/forward buttons on desktop and the hardware back button on Android
    // both retrace tab navigation properly. Assigning location.hash pushes an
    // entry and fires 'hashchange', which our router listener picks up below.
    if (window.location.hash !== `#${tab}`) {
      window.location.hash = tab;
    }
    setCurrentTab(tab);

    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
    window.scrollTo(0, 0);
  }

  // Normalize the very first history entry and stamp it as the app "root".
  // Every later navigateTo() pushes a fresh (stateless) entry on top, so when
  // back navigation returns here, history.state.rmRoot tells us we're at the
  // base of the stack and the Android handler can offer exit instead of leaving.
  useEffect(() => {
    const raw = window.location.hash.replace('#', '');
    let initialRoute = 'home';
    if (raw === 'dashboard' || raw.startsWith('dashboard/')) {
      initialRoute = raw; // preserve a deep-linked dashboard sub-route
    } else if (TAB_SEQUENCE.includes(raw)) {
      initialRoute = raw;
    }
    window.history.replaceState({ rmRoot: true }, '', `#${initialRoute}`);
  }, []);

  useEffect(() => {
    const sanitizeAndRoute = () => {
      const rawHash = window.location.hash.replace('#', '');
      if (!rawHash) {
        setCurrentTab('home');
        return;
      }

      if (rawHash === 'dashboard' || rawHash.startsWith('dashboard/')) {
        setCurrentTab('dashboard');
      } else if (TAB_SEQUENCE.includes(rawHash)) {
        setCurrentTab(rawHash);
      } else {
        setCurrentTab('home');
      }
    };

    sanitizeAndRoute();
    window.addEventListener('hashchange', sanitizeAndRoute);
    return () => window.removeEventListener('hashchange', sanitizeAndRoute);
  }, []);

  useEffect(() => {
    if (currentTab === 'revision') {
      lazyLoadRevisionQueue();
    }
  }, [currentTab]);

  const handleGlobalRefresh = async () => {
    if (currentTab === 'dashboard') {
      await Promise.all([handleSyncData(), refreshDashboard()]);
    } else if (currentTab === 'home') {
      await Promise.all([handleSyncData(), refreshHomeNote()]);
    } else {
      await handleSyncData();
    }
  };

  useEffect(() => {
    async function fetchLatesAppVersion() {
      try {
        const data = await authService.getVersion();

        const remoteVersion = typeof data === 'object' ? data.version : data;
        setlatestVersion(remoteVersion);

      } catch (err) {
        console.error("Failed to sync version configuration:", err);
      }
    }
    fetchLatesAppVersion();
  }, []);

  const dashboardRef = useRef(null);
  const revisionRef = useRef(null);
  const settingsRef = useRef(null);

  const isHomeRefreshing = usePullToRefresh(mainContentRef, handleGlobalRefresh, pullDistance, setPullDistance, setPullMessage);
  const isDashRefreshing = usePullToRefresh(dashboardRef, handleGlobalRefresh, pullDistance, setPullDistance, setPullMessage);
  const isRevRefreshing = usePullToRefresh(revisionRef, handleGlobalRefresh, pullDistance, setPullDistance, setPullMessage);
  const isSetRefreshing = usePullToRefresh(settingsRef, handleGlobalRefresh, pullDistance, setPullDistance, setPullMessage);

  const isAnyRefreshing = isHomeRefreshing || isDashRefreshing || isRevRefreshing || isSetRefreshing;

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-theme flex flex-col items-center justify-center gap-5 select-none">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-2xl bg-theme-accent/10 blur-xl animate-pulse" />
          <div className="relative h-12 w-12 rounded-2xl bg-theme-card border border-theme flex items-center justify-center text-theme-accent">
            <Brain size={22} className="stroke-[1.6]" />
            <span className="absolute -inset-1 rounded-2xl border-2 border-theme-accent/30 border-t-theme-accent animate-spin [animation-duration:1.1s]" />
          </div>
        </div>
        <div className="text-theme-muted font-mono text-[11px] tracking-[0.25em] uppercase animate-pulse">
          Verifying Session
        </div>
      </div>
    );
  }

  if (!isDisconnecting && !isAuthenticated) {
    return <AuthPage onAuthSuccess={() => navigateTo('home')} />;
  }

  if (!isCountLoaded) {
    return (
      <div className="h-[100dvh] w-full bg-theme flex flex-col items-center justify-between pt-[34vh] pb-6 px-6 select-none">
        <div className="flex flex-col items-center gap-5">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-2xl bg-theme-accent/10 blur-xl animate-pulse" />
            <div className="relative h-12 w-12 rounded-2xl bg-theme-card border border-theme flex items-center justify-center text-theme-accent">
              <Brain size={22} className="stroke-[1.6]" />
              <span className="absolute -inset-1 rounded-2xl border-2 border-theme-accent/30 border-t-theme-accent animate-spin [animation-duration:1.1s]" />
            </div>
          </div>
          <div className="text-theme-muted font-mono text-[11px] tracking-[0.25em] uppercase animate-pulse text-center">
            Initializing Engine
          </div>
        </div>
        <div className="text-[9px] font-mono text-theme-muted/30 tracking-widest uppercase">
          {localVersion}
        </div>
      </div>
    );
  }

  const activeMessage = statusMessage || (isManualRefreshing ? "Syncing" : null);
  const activeType = statusMessage ? (statusMessage.type || 'success') : 'sync';
  const activeTabOffsetIndex = TAB_SEQUENCE.indexOf(currentTab);

  // On desktop the four panes no longer live on a horizontal translate track:
  // the active pane simply fills the content column next to the sidebar.
  const dynamicSlideTransformStyle = isDesktop
    ? { transform: 'none', transition: 'none', contain: 'layout style' }
    : {
        transform: `translateY(${pullDistance}px) translateX(-${activeTabOffsetIndex * 25}%)`,
        transition: pullDistance === 0 ? 'transform 330ms cubic-bezier(0.19, 1, 0.22, 1), filter 250ms ease' : 'none',
        filter: isAnyRefreshing ? 'blur(0.5px) saturate(0.98)' : 'blur(0px) saturate(1)',
        contain: 'layout style'
      };

  if (latestVersion && String(latestVersion).trim() !== String(localVersion).trim()) {
    return <VersionGuard localVersion={localVersion} latestVersion={latestVersion} />;
  }

  return (
    <div className="flex flex-col md:flex-row flex-1 h-full w-full relative text-theme-primary antialiased font-sans bg-theme select-none">

      <div
        style={{ height: 'env(safe-area-inset-top, 24px)' }}
        className="fixed top-0 left-0 right-0 bg-theme z-[90] w-full md:hidden"
      />

      <style>{`
        .refresh-lock-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          pointer-events: none;
          backdrop-filter: blur(1.5px) saturate(70%);
          -webkit-backdrop-filter: blur(1.5px) saturate(70%);
          background: color-mix(in srgb, var(--theme-bg, #000) 8%, transparent);
          animation: refreshOverlayIn 180ms ease;
        }
        .refresh-lock-overlay::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 3px 3px;
          opacity: 0.4;
        }
        .ptr-element { display: none !important; }
        .pull-to-refresh-material { overflow: visible !important; height: auto !important; min-height: 100% !important; }
        .pull-to-refresh-material__control { z-index: 100 !important; top: 32px !important; }
      `}</style>

      <StatusCapsule
        message={activeMessage}
        type={activeType}
      />

      {/* ============================================================
          DESKTOP SIDEBAR (lg+) — replaces the bottom tab bar on web.
          Hidden on mobile/tablet, where the slide track + pill nav stay.
      ============================================================ */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-full border-r border-theme bg-theme-card px-4 py-6 gap-1.5">
        <div className="flex items-center gap-2.5 px-2 pb-6 mb-2 border-b border-theme">
          <div className="h-9 w-9 rounded-xl bg-theme border border-theme flex items-center justify-center text-theme-accent shrink-0">
            <Brain size={18} className="stroke-[1.7]" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-theme-primary leading-none">Reminiscence</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-theme-muted mt-1.5">Retention Engine</div>
          </div>
        </div>

        <SideNavBtn active={currentTab === 'home'} onClick={() => navigateTo('home')} icon={HomeIcon} label="Home" />
        <SideNavBtn active={currentTab === 'dashboard'} onClick={() => navigateTo('dashboard')} icon={LayoutDashboard} label="Dashboard" />
        <SideNavBtn active={currentTab === 'revision'} onClick={() => navigateTo('revision')} icon={BookOpen} label="Review" badge={globalCount} />
        <SideNavBtn active={currentTab === 'settings'} onClick={() => navigateTo('settings')} icon={Settings} label="Settings" />

        <div className="mt-auto px-2 pt-4 border-t border-theme">
          <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-theme-muted/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
            <span>{localVersion}</span>
          </div>
        </div>
      </aside>

      {/* Main Slide Track Viewport Wrapper */}
      <div
        className="flex-1 min-w-0 overflow-hidden relative h-full w-full xl:flex-none xl:w-[44rem] 2xl:w-[52rem]"
        style={{ touchAction: 'pan-y' }}
      >
        <div
          className="absolute top-0 left-0 right-0 z-20 flex justify-center pointer-events-none"
          style={{
            transform: `translateY(${Math.min(pullDistance * 0.3, 12)}px)`,
            transition: isAnyRefreshing ? 'transform 0.2s ease' : 'none'
          }}
        >
          {pullMessage && (
            <div className="mt-2 text-[10px] font-medium tracking-wide text-theme-muted transition-opacity duration-150">
              {pullMessage}
            </div>
          )}
        </div>

        <div
          style={{
            ...dynamicSlideTransformStyle,
            pointerEvents: isAnyRefreshing ? 'none' : 'auto'
          }}
          className="w-[400%] lg:w-full h-full flex items-start will-change-transform"
        >
          <main
            ref={mainContentRef}
            className={`w-1/4 lg:w-full h-full overflow-y-auto px-5 lg:px-10 pt-6 lg:pt-10 pb-[140px] md:pb-12 scroll-smooth min-h-screen relative ${currentTab === 'home' ? 'lg:block' : 'lg:hidden'} ${isAnyRefreshing ? 'overflow-hidden' : ''}`}
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            <HomePage pendingCount={globalCount} onNavigateToReview={() => navigateTo('revision')} mainContentRef={mainContentRef} />
          </main>

          <main
            ref={dashboardRef}
            className={`w-1/4 lg:w-full h-full overflow-y-auto px-5 lg:px-10 pt-6 lg:pt-10 pb-[140px] md:pb-12 scroll-smooth min-h-screen relative ${currentTab === 'dashboard' ? 'lg:block' : 'lg:hidden'} ${isAnyRefreshing ? 'overflow-hidden' : ''}`}
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            <DashboardScreen />
          </main>

          <main
            ref={revisionRef}
            className={`w-1/4 lg:w-full h-full overflow-y-auto px-5 lg:px-10 pt-6 lg:pt-10 pb-[140px] md:pb-12 scroll-smooth min-h-screen relative ${currentTab === 'revision' ? 'lg:block' : 'lg:hidden'} ${isAnyRefreshing ? 'overflow-hidden' : ''}`}
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            <ReviewScreen onBackToHome={() => navigateTo('home')} />
          </main>

          <main
            ref={settingsRef}
            className={`w-1/4 lg:w-full h-full overflow-y-auto px-5 lg:px-10 pt-6 lg:pt-10 pb-[140px] md:pb-12 scroll-smooth min-h-screen relative ${currentTab === 'settings' ? 'lg:block' : 'lg:hidden'} ${isAnyRefreshing ? 'overflow-hidden' : ''}`}
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            <SettingsScreen />
          </main>
        </div>
      </div>

      {/* Desktop right rail (xl+) — Study Companion, or a calm Focus panel while reviewing */}
      <aside className="hidden xl:flex xl:flex-col flex-1 min-w-0 h-full overflow-y-auto border-l border-theme px-6 py-10">
        <StudyRail
          dueCount={globalCount}
          metrics={metrics}
          focusMode={currentTab === 'revision'}
          onStartReview={() => navigateTo('revision')}
        />
      </aside>

      <nav
        className={`
          fixed bottom-0 left-0 right-0 isolate flex opacity-100 z-50 px-5 shadow-2xl h-[74px] justify-around items-center
          w-full max-w-xl mx-auto lg:hidden
          md:bottom-5 md:rounded-2xl md:border md:border-zinc-800/60
          bg-theme-card/90 backdrop-blur-xl backdrop-saturate-150 border-t border-theme
          pb-[env(safe-area-inset-bottom)] will-change-transform transition-all duration-300 ease-out
          ${isKeyboardVisible ? 'hidden' : 'flex'}
          ${isAnyRefreshing ? 'pointer-events-none opacity-40' : 'opacity-100'}
        `}
      >
        <NavBtn
          active={currentTab === 'home'}
          onClick={() => navigateTo('home')}
          icon={HomeIcon}
          label="Home"
        />
        <NavBtn
          active={currentTab === 'dashboard'}
          onClick={() => navigateTo('dashboard')}
          icon={LayoutDashboard}
          label="Dashboard"
        />

        <button
          disabled={isAnyRefreshing}
          onClick={() => navigateTo('revision')}
          className={`
            flex flex-col items-center justify-center w-16 h-full relative group
            transition-all duration-150 active:scale-95 outline-none select-none
            ${currentTab === 'revision' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}
            ${isAnyRefreshing ? 'cursor-not-allowed' : ''}
          `}
        >
          <div className="relative p-1 transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95">
            <BookOpen size={20} className="stroke-[1.8]" />
            {globalCount > 0 && (
              <span className="absolute -top-0.5 -right-2.5 bg-blue-500 text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-zinc-950 shadow-lg tracking-tighter">
                {globalCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-wide mt-0.5 font-mono uppercase text-center">Review</span>
        </button>

        <NavBtn
          active={currentTab === 'settings'}
          onClick={() => navigateTo('settings')}
          icon={Settings}
          label="Settings"
        />
      </nav>

      {isAnyRefreshing && (
        <div className="refresh-lock-overlay" />
      )}

      {showWelcome && (
        <WelcomeSheet onComplete={handleWelcomeComplete} />
      )}
    </div>
  );
}

function SideNavBtn({ active, onClick, icon: Icon, label, badge = 0 }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-3 w-full pl-4 pr-3 py-2.5 rounded-xl text-left transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 active:scale-[0.99] ${
        active
          ? 'bg-blue-500/10 text-blue-400'
          : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
      }`}
    >
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-blue-400 transition-opacity duration-200 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <Icon size={18} className="stroke-[1.8] shrink-0" />
      <span className="text-sm font-medium tracking-tight flex-1">{label}</span>
      {badge > 0 && (
        <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center tracking-tight shadow-sm">
          {badge}
        </span>
      )}
    </button>
  );
}

function NavBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 h-full group relative transition-all duration-150 active:scale-95 outline-none select-none ${
        active ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <div className="p-1 transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95">
        <Icon size={20} className="stroke-[1.8]" />
      </div>
      <span className="text-[10px] font-semibold tracking-wide mt-0.5 font-mono uppercase text-center">{label}</span>
    </button>
  );
}