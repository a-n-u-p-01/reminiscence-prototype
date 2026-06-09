import React, { useState, useEffect, useRef } from 'react';
import { Clock, BookOpen, Settings, Home as HomeIcon, LayoutDashboard } from 'lucide-react';
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
import { authService } from './api/authService';
import pkg from '../package.json'

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
        setPullMessage('Release to refresh');
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
  const { isAuthenticated, isDisconnecting, loading } = useAuth();
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

  const { refreshDashboard } = useDashboard();
  const { refreshHomeNote, statusMessage, setStatusMessage, setIsPullToRefresh } = useHomeEngine();

  const [currentTab, setCurrentTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return TAB_SEQUENCE.includes(hash) ? hash : 'home';
  });

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [backPressExitFlag, setBackPressExitFlag] = useState(false);

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
        const hash = window.location.hash.replace('#', '');

        if (hash.startsWith('dashboard/concepts')) {
          window.history.back();
          return;
        }

        if (currentTab !== 'home') {
          navigateTo('home');
          return;
        }

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
  }, [currentTab, backPressExitFlag, setStatusMessage]);

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

  const navigateTo = (tab) => {
    window.history.replaceState(null, '', `#${tab}`);
    setCurrentTab(tab);

    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
    window.scrollTo(0, 0);
  };

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
      <div className="h-[100dvh] w-full bg-theme flex flex-col items-center justify-center">
        <div className="text-theme-muted font-mono text-xs tracking-wider animate-pulse">
          Verifying Session...
        </div>
      </div>
    );
  }

  if (!isDisconnecting && !isAuthenticated) {
    return <AuthPage onAuthSuccess={() => navigateTo('home')} />;
  }

  if (!isCountLoaded) {
    return (
      <div className="h-[100dvh] w-full bg-theme flex flex-col items-center justify-between pt-[35vh] pb-0 px-6 select-none">
        <div className="text-theme-muted font-mono text-xs tracking-wider animate-pulse text-center">
          Initializing Engine...
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

  const dynamicSlideTransformStyle = {
    transform: `translateY(${pullDistance}px) translateX(-${activeTabOffsetIndex * 25}%)`,
    transition: pullDistance === 0 ? 'transform 330ms cubic-bezier(0.19, 1, 0.22, 1), filter 250ms ease' : 'none',
    filter: isAnyRefreshing ? 'blur(0.5px) saturate(0.98)' : 'blur(0px) saturate(1)',
    contain: 'layout style'
  };
  if (latestVersion && String(latestVersion).trim() !== String(localVersion).trim()) {
    return <VersionGuard localVersion={localVersion} latestVersion={latestVersion}/>
  }


  return (
    <div className="flex flex-col  md:flex-row flex-1 h-full w-full relative text-theme-primary antialiased font-sans bg-theme select-none">

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

      {/* Main Slide Track Viewport Wrapper */}
      <div
        className="flex-1 overflow-hidden relative h-full w-full"
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
          className="w-[400%] h-full flex items-start will-change-transform"
        >
          <main
            ref={mainContentRef}
            className={`w-1/4 h-full overflow-y-auto px-5 pt-6 pb-[140px] md:pb-12 scroll-smooth min-h-screen relative ${isAnyRefreshing ? 'overflow-hidden' : ''}`}
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            <HomePage pendingCount={globalCount} onNavigateToReview={() => navigateTo('revision')} mainContentRef={mainContentRef} />
          </main>

          <main
            ref={dashboardRef}
            className={`w-1/4 h-full overflow-y-auto px-5 pt-6 pb-[140px] md:pb-12 scroll-smooth min-h-screen relative ${isAnyRefreshing ? 'overflow-hidden' : ''}`}
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            <DashboardScreen />
          </main>

          <main
            ref={revisionRef}
            className={`w-1/4 h-full overflow-y-auto px-5 pt-6 pb-[140px] md:pb-12 scroll-smooth min-h-screen relative ${isAnyRefreshing ? 'overflow-hidden' : ''}`}
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            <ReviewScreen onBackToHome={() => navigateTo('home')} />
          </main>

          <main
            ref={settingsRef}
            className={`w-1/4 h-full overflow-y-auto px-5 pt-6 pb-[140px] md:pb-12 scroll-smooth min-h-screen relative ${isAnyRefreshing ? 'overflow-hidden' : ''}`}
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            <SettingsScreen />
          </main>
        </div>
      </div>

      {/* ULTRA-PREMIUM INTERACTION NAVIGATION COMPONENT:
        Mobile: Snaps cleanly to screen bottom edge as standard bottom tab layout.
        Laptop/Desktop: Pulls to the center-screen container line with modern glassy round structures.
      */}
      <nav
        className={`
          fixed bottom-0 left-0 right-0 isolate
          md:bottom-5 md:left-1/2 md:-translate-x-1/2 md:rounded-2xl md:border md:border-zinc-800/60
          bg-theme-card/90 backdrop-blur-xl backdrop-saturate-150 border-t border-theme h-[74px] 
          w-full max-w-xl lg:max-w-2xl justify-around items-center z-50 px-5 shadow-2xl pb-[env(safe-area-inset-bottom)] 
          will-change-transform transition-all duration-300 ease-out
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

function NavBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 h-full group relative transition-all duration-150 active:scale-95 outline-none select-none ${active ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
    >
      <div className="p-1 transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95">
        <Icon size={20} className="stroke-[1.8]" />
      </div>
      <span className="text-[10px] font-semibold tracking-wide mt-0.5 font-mono uppercase text-center">{label}</span>
    </button>
  );
}