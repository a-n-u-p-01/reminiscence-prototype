import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';
import './index.css';

import { AuthProvider } from './context/AuthContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { ReviewProvider } from './context/ReviewContext.jsx'; 
import { DashboardProvider } from './context/DashboardContext.jsx'; 
import { HomeProvider } from './context/HomeContext.jsx'; // 🔑 Import clean context hook wrapper
import { registerSW } from "virtual:pwa-register";
registerSW();

// Prevent flash before React mounts
const savedTheme = localStorage.getItem('appTheme') || 'zinc';
const savedScale = localStorage.getItem('appTextScale') || 'base';

document.documentElement.className = `theme-${savedTheme}`;

const scaleMap = {
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
};

document.documentElement.style.setProperty(
  '--app-font-size',
  scaleMap[savedScale] || '16px'
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <ReviewProvider>
          <DashboardProvider>
            <HomeProvider> {/* 🔑 Wrapped here to grant access to App layout matrices */}
              <App />
            </HomeProvider>
          </DashboardProvider>
        </ReviewProvider>
      </AuthProvider>
    </SettingsProvider>
  </React.StrictMode>,
);