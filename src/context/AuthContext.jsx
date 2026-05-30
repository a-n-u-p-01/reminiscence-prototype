import React, { createContext, useContext, useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

const AuthContext = createContext(null);

// --- Native Storage Utilities (Survives app kill on Android) ---
const setItem = async (key, value) => {
  await Preferences.set({ key, value: JSON.stringify(value) });
};

export const getItem = async (key) => {
  const { value } = await Preferences.get({ key });
  if (!value) return null;
  try { return JSON.parse(value); } catch { return value; }
};

const removeItem = async (key) => {
  await Preferences.remove({ key });
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Always start true — wait for async read

  // On boot: read from native storage (async, so loading guards the UI)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await getItem('authToken');
        if (token) {
          const savedUser = await getItem('authUser');
          setIsAuthenticated(true);
          setUser(savedUser);
        }
      } catch (err) {
        console.warn('Session restore failed:', err);
      } finally {
        setLoading(false); // Always unblock UI
      }
    };

    restoreSession();
  }, []);

  const login = async (userData, token) => {
    // Write to native storage first, THEN update state
    await setItem('authToken', token);
    await setItem('authUser', userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await removeItem('authToken');
    await removeItem('authUser');
    setIsAuthenticated(false);
    setUser(null);
  };

  const cleanAuthContext = async () => {
    await removeItem('authToken');
    await removeItem('authUser');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-mono text-xs">
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, login, logout,
      isDisconnecting, setIsDisconnecting, cleanAuthContext,getItem
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);