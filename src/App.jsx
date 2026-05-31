import React, { useState, useEffect, useRef } from 'react';
import { Clock, BookOpen, Settings, Home as HomeIcon } from 'lucide-react';
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
import { App as CapacitorApp } from '@capacitor/app'; // 🔑 Added App import for hardware back event handling
import StatusCapsule from './components/StatusCapsule';
import { useAppReset } from './hooks/useAppReset';

// 🔑 Import storage wrappers and WelcomeSheet component

import { getItem, setItem } from '../src/storage/storageService';
import WelcomeSheet from './components/WelcomeSheet';

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

  // Keep a mutable reference of the distance state updated in touch handlers
  // to avoid clearing/re-binding touch handlers on every coordinate change.
  useEffect(() => {
    currentDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const THRESHOLD = 52;

    const onTouchStart = (e) => {
      if (el.scrollTop === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (!isPulling.current || isRefreshing) return;

      const delta = Math.max(0, e.touches[0].clientY - startY.current);
      
      // Fluid logarithmic tracking curve
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
        setPullDistance(0); // Trigger immediate smooth glide back
        
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

  // 🔑 Guard flag for onboarding visualization
  const [showWelcome, setShowWelcome] = useState(false);

  const {
    globalCount,
    isCountLoaded,
    isManualRefreshing,
    handleSyncData,
    lazyLoadRevisionQueue
  } = useReviewEngine();

  const { refreshDashboard } = useDashboard();
  const { refreshHomeNote, statusMessage, setStatusMessage } = useHomeEngine(); // 🔑 Added setStatusMessage destructor to trigger exit warnings

  const [currentTab, setCurrentTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return TAB_SEQUENCE.includes(hash) ? hash : 'home';
  });

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [backPressExitFlag, setBackPressExitFlag] = useState(false); // 🔑 Tracking flag for back button double tap confirmation

  // 🔑 Query Cap Preferences context state when workspace validation passes
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

  // 🔑 Storage mutator handler logic passed down to sheet callback
  const handleWelcomeComplete = async () => {
    try {
      await setItem('reminiscence_onboarding_acknowledged', 'true');
    } catch (err) {
      console.error(err);
    } finally {
      setShowWelcome(false);
    }
  };

  // Hardware Back Button Handler Loop
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    const setupBackButtonLogic = async () => {
      const backListener = await CapacitorApp.addListener('backButton', () => {
        if (currentTab !== 'home') {
          // If anywhere else, snap directly back to home screen
          navigateTo('home');
        } else {
          // If already on home screen, track double-tap exit window
          if (backPressExitFlag) {
            CapacitorApp.exitApp();
          } else {
            setBackPressExitFlag(true);
            if (setStatusMessage) {
              setStatusMessage({ text: "Press back again to close app", type: "warn" });
            }
            // 🔑 Message display timeout set to exactly 1 second (1000ms)
            setTimeout(() => {
              setBackPressExitFlag(false);
              if (setStatusMessage) setStatusMessage(null);
            }, 1500);
          }
        }
      });
      return backListener;
    };

    const backButtonEventInstance = setupBackButtonLogic();
    return () => {
      backButtonEventInstance.then(listener => listener.remove());
    };
  }, [currentTab, backPressExitFlag, setStatusMessage]);

  // Touch Drag-Tracking Reference Engines
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const isHorizontalSwipe = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

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
    setDragOffset(0);

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

      if (TAB_SEQUENCE.includes(rawHash)) {
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

  // Add refs for tabs 2-4 (tab 1 already has mainContentRef)
  const dashboardRef = useRef(null);
  const revisionRef = useRef(null);
  const settingsRef = useRef(null);

  // Attach pull-to-refresh to each tab 🔑 Captured refresh states
  const isHomeRefreshing = usePullToRefresh(
    mainContentRef,
    handleGlobalRefresh,
    pullDistance,
    setPullDistance,
    setPullMessage
  );

  const isDashRefreshing = usePullToRefresh(
    dashboardRef,
    handleGlobalRefresh,
    pullDistance,
    setPullDistance,
    setPullMessage
  );

  const isRevRefreshing = usePullToRefresh(
    revisionRef,
    handleGlobalRefresh,
    pullDistance,
    setPullDistance,
    setPullMessage
  );

  const isSetRefreshing = usePullToRefresh(
    settingsRef,
    handleGlobalRefresh,
    pullDistance,
    setPullDistance,
    setPullMessage
  );

  const isAnyRefreshing = isHomeRefreshing || isDashRefreshing || isRevRefreshing || isSetRefreshing;

  // Real-time Drag-Tracking Engine Loops
  const handleTouchStart = (e) => {
    if (isAnyRefreshing) return; // 🔑 Lock
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    isHorizontalSwipe.current = null;
    setIsAnimating(false);
  };

  const handleTouchMove = (e) => {
    if (isAnyRefreshing || !isDragging.current) return; // 🔑 Lock

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const deltaX = touchStartX.current - currentX;
    const deltaY = touchStartY.current - currentY;

    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) {
        isHorizontalSwipe.current = false;
        isDragging.current = false;
        return;
      }
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
        isHorizontalSwipe.current = true;
      }
    }

    if (isHorizontalSwipe.current === true) {
      const currentIdx = TAB_SEQUENCE.indexOf(currentTab);

      if ((currentIdx === 0 && deltaX < 0) || (currentIdx === TAB_SEQUENCE.length - 1 && deltaX > 0)) {
        setDragOffset(-deltaX * 0.25);
      } else {
        setDragOffset(-deltaX);
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (isAnyRefreshing || (!isDragging.current && isHorizontalSwipe.current !== true)) return; // 🔑 Lock

    isDragging.current = false;
    setIsAnimating(true);

    const windowWidth = window.innerWidth;
    const dragThreshold = windowWidth * 0.12;
    const currentIdx = TAB_SEQUENCE.indexOf(currentTab);

    if (isHorizontalSwipe.current === true) {
      if (dragOffset < -dragThreshold && currentIdx < TAB_SEQUENCE.length - 1) {
        navigateTo(TAB_SEQUENCE[currentIdx + 1]);
      } else if (dragOffset > dragThreshold && currentIdx > 0) {
        navigateTo(TAB_SEQUENCE[currentIdx - 1]);
      } else {
        setDragOffset(0);
      }
    }

    setTimeout(() => {
      setDragOffset(0);
    }, 0);

    touchStartX.current = 0;
    touchStartY.current = 0;
  };

  // 1. If AuthContext is still checking cookies, show a loading state
  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-theme flex flex-col items-center justify-center">
        <div className="text-theme-muted font-mono text-xs tracking-wider animate-pulse">
          Verifying Session...
        </div>
      </div>
    );
  }

  // 2. Once loading is false, if NOT authenticated, show AuthPage
  if (!isDisconnecting && !isAuthenticated) {
    return <AuthPage onAuthSuccess={() => navigateTo('home')} />;
  }

  // 3. If authenticated but data hasn't loaded yet, show Init state
  if (!isCountLoaded) {
    return (
      <div className="h-[100dvh] w-full bg-theme flex flex-col items-center justify-between pt-[35vh] pb-0 px-6 select-none">
        <div className="text-theme-muted font-mono text-xs tracking-wider animate-pulse text-center">
          Initializing Engine...
        </div>
        <div className="text-[9px] font-mono text-theme-muted/30 tracking-widest uppercase">
          v1.0.0
        </div>
      </div>
    );
  }

  const activeMessage = statusMessage || (isManualRefreshing ? "Syncing" : null);
  const activeType = statusMessage ? (statusMessage.type || 'success') : 'sync';

  const activeTabOffsetIndex = TAB_SEQUENCE.indexOf(currentTab);

  // 🔑 Optimized Transform Config: Uses filters for a professional, "locked" feel instead of fading opacity
  const dynamicSlideTransformStyle = {
    transform: `translateY(${pullDistance}px) translateX(calc(-${activeTabOffsetIndex * 25}% + ${dragOffset}px))`,
    transition: isAnimating || pullDistance === 0
      ? 'transform 330ms cubic-bezier(0.19, 1, 0.22, 1), filter 250ms ease'
      : 'none',

    filter: isAnyRefreshing
      ? 'blur(0.5px) saturate(0.98)'
      : 'blur(0px) saturate(1)',

    contain: 'layout style'
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full relative text-theme-primary antialiased font-sans bg-theme select-none">

      {/* Safe Area Spacer Layout Shield */}
      <div
        style={{ height: 'env(safe-area-inset-top, 24px)' }}
        className="fixed top-0 left-0 right-0 bg-theme z-[90] w-full"
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

      {/* Real-time Tracking View Window Wrapper */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-hidden relative"
        style={{ touchAction: isAnyRefreshing ? 'none' : 'pan-y pinch-zoom' }}
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
        {/* SLIDING TRACK SLIDER */}
        <div
          style={{
            ...dynamicSlideTransformStyle,
            pointerEvents: isAnyRefreshing ? 'none' : 'auto'
          }}
          className="w-[400%] h-full flex items-start will-change-transform"
        >
          {/* Tab 1: Home */}
          <main
            ref={mainContentRef}
            className={`w-1/4 h-full overflow-y-auto px-5 pt-6 pb-[140px] scroll-smooth min-h-screen relative ${isAnyRefreshing ? 'overflow-hidden' : ''}`}
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            <HomePage pendingCount={globalCount} onNavigateToReview={() => navigateTo('revision')} mainContentRef={mainContentRef} />
          </main>

          {/* Tab 2: Dashboard */}
          <main
            ref={dashboardRef}
            className={`w-1/4 h-full overflow-y-auto px-5 pt-6 pb-[140px] scroll-smooth min-h-screen relative ${isAnyRefreshing ? 'overflow-hidden' : ''}`}
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            <DashboardScreen />
          </main>

          {/* Tab 3: Revision */}
          <main
            ref={revisionRef}
            className={`w-1/4 h-full overflow-y-auto px-5 pt-6 pb-[140px] scroll-smooth min-h-screen relative ${isAnyRefreshing ? 'overflow-hidden' : ''}`}
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            <ReviewScreen onBackToHome={() => navigateTo('home')} />
          </main>

          {/* Tab 4: Settings */}
          <main
            ref={settingsRef}
            className={`w-1/4 h-full overflow-y-auto px-5 pt-6 pb-[140px] scroll-smooth min-h-screen relative ${isAnyRefreshing ? 'overflow-hidden' : ''}`}
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          >
            <SettingsScreen />
          </main>
        </div>
      </div>

      <nav
        className={`
          fixed bottom-0 left-0 right-0 bg-theme-card backdrop-blur-md border-t border-theme h-[74px] 
          justify-around items-center z-50 px-4 shadow-2xl pb-[env(safe-area-inset-bottom)] 
          will-change-transform transition-all duration-300 
          ${isKeyboardVisible ? 'hidden' : 'flex'}
          ${isAnyRefreshing ? 'pointer-events-none' : ''}
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
          icon={Clock}
          label="History"
        />

        {/* Review Button: Adding the disabled attribute */}
        <button
          disabled={isAnyRefreshing}
          onClick={() => navigateTo('revision')}
          className={`
            flex flex-col items-center justify-center w-16 h-full transition-colors duration-150 relative
            ${currentTab === 'revision' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-400'}
            ${isAnyRefreshing ? 'cursor-not-allowed' : ''}
          `}
        >
          <div className="relative p-1">
            <BookOpen size={20} />
            {globalCount > 0 && (
              <span className="absolute top-0 -right-2 bg-blue-500 text-white text-[9px] font-extrabold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border-2 border-theme shadow-md">
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

      {isAnyRefreshing && (
        <div className="refresh-lock-overlay" />
      )}

      {/* 🔑 Onboarding context rendering engine gate wrapper */}
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
      className={`flex flex-col items-center justify-center w-16 h-full transition-colors duration-150 ${
        active ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-400'
      }`}
    >
      <Icon size={20} className="p-0.5" />
      <span className="text-[10px] font-medium tracking-tight mt-0.5">{label}</span>
    </button>
  );
}