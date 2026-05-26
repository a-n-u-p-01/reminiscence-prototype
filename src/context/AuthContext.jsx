import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// --- Foolproof Cookie Utilities (Handles special characters & '=' signs perfectly) ---
const setCookie = (name, value, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(';').shift());
  }
  return '';
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const AuthProvider = ({ children }) => {
  // Pull credentials directly from the cookie strings on bootup
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!getCookie('authToken');
  });
  const [user, setUser] = useState(() => {
    const savedUser = getCookie('authUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCookie('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Saves data cleanly into separate, dedicated cookies
  const login = (userData, token) => {
    setCookie('authToken', token, 7); 
    setCookie('authUser', JSON.stringify(userData), 7);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Completely wipes cookies out of the browser
  const logout = () => {
    deleteCookie('authToken');
    deleteCookie('authUser');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-mono text-xs">
        Parsing security credentials...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);