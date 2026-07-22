import { useContext, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import Loader from "./components/Loader";
import AuthModal from "./components/AuthModal";
import { LoaderContext } from "./context/LoaderContext";
import { AuthContext } from "./context/AuthContext";
import { savePushSubscription } from './services/api';
import {
  initializeFirebase,
  listenForFcmMessages,
} from './services/firebaseMessaging';
import './styles/global.css';
import './components/Loader.css';

const RELOAD_HINT_KEY = 'delivo_refresh_pending';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }

  return output;
};

const arrayBufferToBase64 = (buffer) => {
  if (!buffer) {
    return '';
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
};

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(`/sw.js?v=${Date.now()}`);
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.warn('Service worker registration failed', error);
    return null;
  }
};

// Register Web Push API subscription (VAPID-based, separate from FCM)
// Only called when user is authenticated so the backend can associate the subscription
const registerBrowserPushSubscription = async () => {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  if (!vapidPublicKey) {
    console.warn('Browser push registration skipped: frontend public VAPID key is not configured.');
    return;
  }

  try {
    const registration = await registerServiceWorker();
    if (!registration) {
      return;
    }

    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return;
    }

    const options = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    };

    const subscription = await registration.pushManager.subscribe(options);
    await savePushSubscription({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth')),
      },
    });
  } catch (error) {
    console.warn('Browser push registration skipped:', error);
  }
};

const logRefreshNotification = (status, data = {}) => {
  const entry = { status, timestamp: new Date().toISOString(), ...data };
  try {
    const existing = JSON.parse(localStorage.getItem('delivoRefreshNotificationTrace') || '[]');
    existing.push(entry);
    localStorage.setItem('delivoRefreshNotificationTrace', JSON.stringify(existing.slice(-20)));
  } catch (err) {
    // ignore storage errors
  }
};

const registerAndTriggerRealServerWebPush = async () => {
  const timeStr = new Date().toLocaleTimeString();

  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[WebPush] Web push is not supported in this browser environment.');
    return;
  }

  // Request permission if default
  if (Notification.permission === 'default') {
    try {
      const res = await Notification.requestPermission();
      console.log('[WebPush] Notification permission requested:', res);
    } catch (err) {
      console.warn('[WebPush] Permission request error:', err);
    }
  }

  if (Notification.permission !== 'granted') {
    console.warn('[WebPush] Permission not granted:', Notification.permission);
    return;
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BHfiaX7G8DIf2Ryphn3kSRvb1-8vwznP7Og4eu3Q--8ieIVrkyFR6cGYIuGhSNY9yB4MQvRu7E2ixNGuZq7gvW0';

  try {
    const registration = await registerServiceWorker();
    if (!registration) {
      console.warn('[WebPush] Could not register service worker');
      return;
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const options = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      };
      subscription = await registration.pushManager.subscribe(options);
      console.log('[WebPush] Created new VAPID subscription:', subscription.endpoint.substring(0, 35));
    }

    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth')),
      },
    };

    // Save subscription to backend using public endpoint
    const apiBase = import.meta.env.DEV ? 'http://localhost:5000/api' : (import.meta.env.VITE_API_URL || '/api');
    await fetch(`${apiBase}/notifications/public-subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionData),
    });

    // Trigger real VAPID Web Push from backend server ONLY for this specific device endpoint!
    const triggerRes = await fetch(`${apiBase}/notifications/public-trigger-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        title: 'Delivo Web Push 🍕',
        message: `Notification active! (Refreshed at ${timeStr})`,
        tag: 'delivo-refresh-alert',
      }),
    });



    const result = await triggerRes.json();
    console.log('🚀 [WebPush] Server Web Push result:', result);
  } catch (error) {
    console.error('[WebPush] Error triggering real server Web Push:', error);
  }
};



function App() {
  const { isLoading } = useContext(LoaderContext);
  const { user, token } = useContext(AuthContext);
  const location = useLocation();

  // Initialize Firebase, register Web Push, and trigger real server push on refresh
  useEffect(() => {
    initializeFirebase();

    const markBeforeUnload = () => {
      sessionStorage.setItem(RELOAD_HINT_KEY, '1');
    };

    window.addEventListener('beforeunload', markBeforeUnload);
    registerAndTriggerRealServerWebPush();

    return () => {
      window.removeEventListener('beforeunload', markBeforeUnload);
    };
  }, []);

  // Register push subscriptions and FCM listener AFTER user is authenticated
  useEffect(() => {
    if (!user || !token) return;

    // Register VAPID-based Web Push subscription (requires auth to save to backend)
    registerBrowserPushSubscription();

    // Listen for foreground FCM messages
    const unsubscribe = listenForFcmMessages((notification) => {
      console.log('Foreground FCM notification:', notification);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?._id, token]);

  // Hide navbar on admin and restaurant portal routes
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isRestaurantRoute = location.pathname.startsWith('/restaurant');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {isLoading && <Loader />}
      <AuthModal />
      {!isAdminRoute && !isRestaurantRoute && <Navbar />}
      <main className={isAdminRoute || isRestaurantRoute ? 'admin-page-main' : ''}>
        <AppRoutes />
      </main>
    </div>
  );
}


export default App;