import { createContext, useEffect, useState } from 'react';
import { initializeFirebase, requestFcmToken, saveFcmToken } from '../services/firebaseMessaging';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ✅ ADD LOADING STATE
  const [isFcmRegistered, setIsFcmRegistered] = useState(false);

  // ✅ LOAD AUTH FROM STORAGE ON MOUNT
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (err) {
        console.error('Failed to parse saved auth:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    }
    setIsLoading(false); // ✅ DONE LOADING
  }, []);

  // ✅ LOGIN - SINGLE SOURCE OF TRUTH
  // Stores user + token in localStorage AND React state
  const login = (userData, authToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    setUser(userData);
    setToken(authToken);
    setIsFcmRegistered(false);
  };

  // ✅ LOGOUT - CLEAR AUTH ONLY (NOT CART)
  // Cart items should persist per user in localStorage
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };



  const registerFcmTokenForUser = async (currentUser) => {
    const activeUser = currentUser || user;
    const authToken = token || localStorage.getItem('token');
    if (!activeUser || !authToken || isFcmRegistered) return null;
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('[Auth] Browser does not support service workers or notifications. FCM registration skipped.');
      return null;
    }

    const hasFirebaseConfig =
      import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID &&
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
      import.meta.env.VITE_FIREBASE_APP_ID;

    if (!hasFirebaseConfig) {
      console.warn('[Auth] Firebase web config is missing. Browser push may remain unavailable until the frontend env includes it.');
    }

    try {
      initializeFirebase();
      if (Notification.permission === 'default') {
        try {
          const res = await Notification.requestPermission();
          console.log('[Auth] Notification permission request result:', res);
        } catch (err) {
          console.warn('[Auth] Notification permission request failed:', err);
        }
      }

      if (Notification.permission !== 'granted') {
        console.warn('[Auth] Notification permission not granted. FCM registration skipped.');
        return null;
      }

      const fcmToken = await requestFcmToken();
      if (fcmToken) {
        await saveFcmToken(fcmToken, activeUser.id || activeUser._id);
        setIsFcmRegistered(true);
        console.log('[Auth] FCM token registered for user', activeUser.id || activeUser._id);
        return fcmToken;
      }
    } catch (error) {
      console.error('[Auth] FCM registration failed:', error);
    }

    return null;
  };

  useEffect(() => {
    const autoRegisterFcm = async () => {
      if (!user || !token || isFcmRegistered) return;
      await registerFcmTokenForUser(user);
    };

    autoRegisterFcm();
  }, [user, token, isFcmRegistered]);

  // ✅ DERIVED STATE - NO DUPLICATE BOOLEAN
  // isAuthenticated is derived from user state (single source of truth)
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        registerFcmTokenForUser,
        isAuthenticated: !!user,
        isLoading, // ✅ ADD LOADING STATE
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
