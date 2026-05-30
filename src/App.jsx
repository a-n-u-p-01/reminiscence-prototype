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
import PullToRefresh from 'react-simple-pull-to-refresh';

import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app'; // 🔑 Added App import for hardware back event handling
import StatusCapsule from './components/StatusCapsule';
import { useAppReset } from './hooks/useAppReset';

const TAB_SEQUENCE = ['home', 'dashboard', 'revision', 'settings'];

export default function App() {
  const { isAuthenticated, isDisconnecting } = useAuth();
  const mainContentRef = useRef(null);
  const clearAppContext = useAppReset();

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

  // Real-time Drag-Tracking Engine Loops
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    isHorizontalSwipe.current = null; 
    setIsAnimating(false); 
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;

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
    if (!isDragging.current && isHorizontalSwipe.current !== true) {
      touchStartX.current = 0;
      touchStartY.current = 0;
      return;
    }
    
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

  if (!isDisconnecting && !isAuthenticated) {
    return <AuthPage onAuthSuccess={() => navigateTo('home')} />;
  }

  if (!isDisconnecting && !isCountLoaded) {
    return (
      <div className="h-[100dvh] w-full bg-theme flex flex-col items-center justify-between pt-[35vh] pb-14 px-6 select-none">
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
  
  // 🔑 Optimized Transform Config: Swapped timing curve to clean layout-contained Apple-spec easing fluid physics
  const dynamicSlideTransformStyle = {
    transform: `translateX(calc(-${activeTabOffsetIndex * 25}% + ${dragOffset}px))`,
    transition: isAnimating ? 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
    contain: 'layout style'
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full relative text-theme-primary antialiased font-sans bg-theme">
      
      {/* Safe Area Spacer Layout Shield */}
      <div
        style={{ height: 'env(safe-area-inset-top, 24px)' }}
        className="fixed top-0 left-0 right-0 bg-theme z-[90] w-full"
      />
      
      <style>{`
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
        className="flex-1 overflow-hidden relative touch-pan-y"
      >
        {/* SLIDING TRACK SLIDER */}
        {/* 🔑 Fixed: Removed "select-none" style from the container to prevent first-render scroll lock on Android WebViews */}
        <div 
          style={dynamicSlideTransformStyle}
          className="w-[400%] h-full flex items-start will-change-transform"
        >
          {/* Tab 1: Home */}
          <main ref={mainContentRef} className="w-1/4 h-full overflow-y-auto px-5 pt-6 pb-[140px] scroll-smooth min-h-screen relative">
            <PullToRefresh onRefresh={handleGlobalRefresh} resistance={2.6} pullingContent={<div />} refreshingContent={<div />}>
              <div>
                <HomePage pendingCount={globalCount} onNavigateToReview={() => navigateTo('revision')} mainContentRef={mainContentRef} />
              </div>
            </PullToRefresh>
          </main>

          {/* Tab 2: Dashboard */}
          <main className="w-1/4 h-full overflow-y-auto px-5 pt-6 pb-[140px] scroll-smooth min-h-screen relative">
            <PullToRefresh onRefresh={handleGlobalRefresh} resistance={2.6} pullingContent={<div />} refreshingContent={<div />}>
              <div>
                <DashboardScreen />
              </div>
            </PullToRefresh>
          </main>

          {/* Tab 3: Revision */}
          <main className="w-1/4 h-full overflow-y-auto px-5 pt-6 pb-[140px] scroll-smooth min-h-screen relative">
            <PullToRefresh onRefresh={handleGlobalRefresh} resistance={2.6} pullingContent={<div />} refreshingContent={<div />}>
              <div>
                <ReviewScreen onBackToHome={() => navigateTo('home')} />
              </div>
            </PullToRefresh>
          </main>

          {/* Tab 4: Settings */}
          <main className="w-1/4 h-full overflow-y-auto px-5 pt-6 pb-[140px] scroll-smooth min-h-screen relative">
            <PullToRefresh onRefresh={handleGlobalRefresh} resistance={2.6} pullingContent={<div />} refreshingContent={<div />}>
              <div>
                <SettingsScreen />
              </div>
            </PullToRefresh>
          </main>
        </div>
      </div>

      <nav className={`fixed bottom-0 left-0 right-0 bg-theme-card backdrop-blur-md border-t border-theme h-[74px] justify-around items-center z-50 px-4 shadow-2xl pb-[env(safe-area-inset-bottom)] will-change-transform transition-transform duration-150 ${
        isKeyboardVisible ? 'hidden' : 'flex'
      }`}>
        <NavBtn active={currentTab === 'home'} onClick={() => navigateTo('home')} icon={HomeIcon} label="Home" />
        <NavBtn active={currentTab === 'dashboard'} onClick={() => navigateTo('dashboard')} icon={Clock} label="History" />

        <button
          onClick={() => navigateTo('revision')}
          className={`flex flex-col items-center justify-center w-16 h-full transition-colors duration-150 relative ${
            currentTab === 'revision' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-400'
          }`}
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

        <NavBtn active={currentTab === 'settings'} onClick={() => navigateTo('settings')} icon={Settings} label="Settings" />
      </nav>
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