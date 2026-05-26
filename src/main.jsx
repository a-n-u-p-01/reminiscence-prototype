import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';

const savedTheme = localStorage.getItem('appTheme') || 'zinc';
const savedScale = localStorage.getItem('appTextScale') || '16px';
document.documentElement.className = `theme-${savedTheme}`;
document.documentElement.style.setProperty('--app-font-size', savedScale);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);