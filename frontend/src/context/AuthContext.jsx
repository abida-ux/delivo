import { createContext, useEffect, useState } from 'react';
import { sendTestPush } from '../services/api';
import { initializeFirebase, requestFcmToken, saveFcmToken } from '../services/firebaseMessaging';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ✅ ADD LOADING STATE
  const [isFcmRegistered, setIsFcmRegistered] = useState(false);
  const [hasTriggeredRefreshTestPush, setHasTriggeredRefreshTestPush] = useState(false);

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
    console.log('🔵 AuthContext.login() called');
    console.log('   user:', JSON.stringify(userData));
    console.log('   token:', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    setUser(userData);
    setToken(authToken);
    setIsFcmRegistered(false);
    console.log('✅ User set to:', userData);
  };

  // ✅ LOGOUT - CLEAR AUTH ONLY (NOT CART)
  // Cart items should persist per user in localStorage
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  // 🔵 DEBUG: Log localStorage and useEffect
  useEffect(() => {
    console.log('🔄 AuthContext mounted/updated');
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    console.log('   localStorage.user:', savedUser ? 'EXISTS' : 'EMPTY');
    console.log('   localStorage.token:', savedToken ? 'EXISTS' : 'EMPTY');
    console.log('   Current state - user:', user);
  }, [user]);

  const triggerRefreshTestPush = async (currentUser) => {
    if (hasTriggeredRefreshTestPush || !currentUser || !token) return null;

    const params = new URLSearchParams(window.location.search);
    const shouldSendTestPush = params.get('testpush') === '1' || localStorage.getItem('delivo_test_push_on_refresh') === '1';

    if (!shouldSendTestPush) return null;

    try {
      const response = await sendTestPush({
        title: 'Delivo test push',
        message: 'This push notification was sent after a refresh for testing.',
        userId: currentUser.id || currentUser._id,
      });

      if (response?.success) {
        console.log('✅ Refresh test push sent successfully');
      }
    } catch (error) {
      console.error('❌ Refresh test push failed:', error);
    } finally {
      setHasTriggeredRefreshTestPush(true);
      if (window.history.replaceState) {
        const nextUrl = `${window.location.pathname}${window.location.hash}`;
        window.history.replaceState({}, document.title, nextUrl);
      }
    }

    return null;
  };

  const registerFcmTokenForUser = async (currentUser) => {
    const activeUser = currentUser || user;
    const authToken = token || localStorage.getItem('token');
    if (!activeUser || !authToken || isFcmRegistered) return null;
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('⚠️ Browser does not support service workers or notifications. FCM registration skipped.');
      return null;
    }

    const hasFirebaseConfig =
      import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID &&
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
      import.meta.env.VITE_FIREBASE_APP_ID &&
      import.meta.env.VITE_FIREBASE_VAPID_KEY;

    if (!hasFirebaseConfig) {
      console.warn('⚠️ Firebase web config or VAPID key is missing. Continuing with browser permission prompt so notifications can still be requested.');
    }

    try {
      initializeFirebase();
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        console.warn('⚠️ Notification permission not granted. FCM registration skipped.');
        return null;
      }

      const fcmToken = await requestFcmToken();
      if (fcmToken) {
        await saveFcmToken(fcmToken, activeUser.id || activeUser._id);
        setIsFcmRegistered(true);
        console.log('✅ FCM token registered for user', activeUser.id || activeUser._id);
        return fcmToken;
      }
    } catch (error) {
      console.error('❌ FCM registration failed:', error);
    }

    return null;
  };

  useEffect(() => {
    const autoRegisterFcm = async () => {
      if (!user || !token || isFcmRegistered) return;
      await registerFcmTokenForUser(user);
    };

    const autoSendRefreshTestPush = async () => {
      if (!user || !token || isFcmRegistered) return;
      await triggerRefreshTestPush(user);
    };

    autoRegisterFcm();
    autoSendRefreshTestPush();
  }, [user, token, isFcmRegistered, hasTriggeredRefreshTestPush]);

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
