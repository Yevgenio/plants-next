// app/context/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import API_URL from '@/config/config';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'auth';

function readCache(): { isLoggedIn: boolean; isAdmin: boolean } {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : { isLoggedIn: false, isAdmin: false };
  } catch { return { isLoggedIn: false, isAdmin: false }; }
}

function writeCache(state: { isLoggedIn: boolean; isAdmin: boolean }) {
  try {
    if (state.isLoggedIn) sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<{ isLoggedIn: boolean; isAdmin: boolean }>(() => {
    if (typeof window === 'undefined') return { isLoggedIn: false, isAdmin: false };
    return readCache();
  });

  const setAuth = (state: { isLoggedIn: boolean; isAdmin: boolean }) => {
    writeCache(state);
    setAuthState(state);
  };

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/status`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.isLoggedIn) {
        setAuth({ isLoggedIn: true, isAdmin: data.isAdmin });
      } else {
        setAuth({ isLoggedIn: false, isAdmin: false });
      }
    } catch {
      setAuth({ isLoggedIn: false, isAdmin: false });
    }
  };

  useEffect(() => { checkStatus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    if (!res.ok) {
      let message = 'Login failed';
      try {
        const body = await res.json();
        message = body.message || body.error || message;
      } catch {}
      throw new Error(message);
    }
    await checkStatus();
  };

  const logout = async () => {
    await fetch(`${API_URL}/auth/logout`, { method: 'GET', credentials: 'include' });
    setAuth({ isLoggedIn: false, isAdmin: false });
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: authState.isLoggedIn,
        isAdmin: authState.isAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
