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
import StatusCapsule from './components/StatusCapsule';
import { useAppReset } from './hooks/useAppReset';

export default function App() {
  const { isAuthenticated,isDisconnecting } = useAuth();
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
  const { refreshHomeNote, statusMessage } = useHomeEngine(); 

  const [currentTab, setCurrentTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['home', 'dashboard', 'revision', 'settings'].includes(hash) ? hash : 'home';
  });

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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
    window.location.hash = tab;
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

  // 🚪 Gating Shield: Force hard-mount the AuthPage immediately if authentication falls off.
  // This blocks the nested sub-context loops below from evaluating any ghost properties.
  if (!isDisconnecting && !isAuthenticated ) {
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

  // if (isDisconnecting) {
  //   return (
  //    <SettingsScreen />
  //   );
  // }

  const activeMessage = statusMessage || (isManualRefreshing ? "Syncing" : null);
  const activeType = statusMessage ? (statusMessage.type || 'success') : 'sync';

  return (
    <div className="flex flex-col flex-1 h-full w-full relative text-theme-primary antialiased font-sans bg-theme">
      
      {/* Safe Area Spacer Layout Shield */}
      <div
        style={{ height: 'env(safe-area-inset-top, 24px)' }}
        className="fixed top-0 left-0 right-0 bg-theme z-[90] w-full"
      />
      
      <style>{`
        .ptr-element { display: none !important; }
        .pull-to-refresh-material { overflow: visible !important; }
      `}</style>

      <StatusCapsule 
        message={activeMessage} 
        type={activeType} 
      />

      <PullToRefresh
        onRefresh={handleGlobalRefresh}
        resistance={2.6}
        pullingContent={<div />}
        refreshingContent={<div />}
      >
        <main
          ref={mainContentRef}
          className="flex-1 overflow-y-auto px-5 pt-6 pb-[140px] scroll-smooth min-h-screen relative"
        >
          {/* Upgraded from hiding containers using hidden/contents class wrappers to clear logic switches. */}
          {currentTab === 'home' && (
            <HomePage pendingCount={globalCount} onNavigateToReview={() => navigateTo('revision')} mainContentRef={mainContentRef} />
          )}

          {currentTab === 'dashboard' && (
            <DashboardScreen />
          )}

          {currentTab === 'revision' && (
            <ReviewScreen onBackToHome={() => navigateTo('home')} />
          )}

          {currentTab === 'settings' && (
            <SettingsScreen />
          )}
        </main>
      </PullToRefresh>

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