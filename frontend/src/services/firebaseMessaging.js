import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const fallbackFirebaseConfig = {
  apiKey: 'AIzaSyA41-p0LVWmexu4jPS48a7UF6iXMVmRlt8',
  authDomain: 'web-push-e48bc.firebaseapp.com',
  projectId: 'web-push-e48bc',
  storageBucket: 'web-push-e48bc.firebasestorage.app',
  messagingSenderId: '653494159220',
  appId: '1:653494159220:web:1bba64e4015c4d2f714e21',
  measurementId: 'G-QCY4PMD9XS',
};

const resolveFirebaseConfig = () => ({
  ...fallbackFirebaseConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackFirebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || fallbackFirebaseConfig.measurementId,
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
});

// Firebase configuration - from environment variables with safe fallbacks
const firebaseConfig = resolveFirebaseConfig();

let firebaseApp = null;
let messaging = null;

export const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (!firebaseConfig.projectId) {
    console.warn('[FCM] Firebase config incomplete. FCM notifications will not work.');
    console.warn('      Set VITE_FIREBASE_* environment variables to enable FCM.');
    return null;
  }

  try {
    firebaseApp = initializeApp(firebaseConfig);
    messaging = getMessaging(firebaseApp);
    console.log('[FCM] Firebase initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('[FCM] Firebase initialization failed:', error.message);
    return null;
  }
};

export const getMessagingInstance = () => {
  if (!messaging) {
    return null;
  }
  return messaging;
};

export const requestFcmToken = async () => {
  if (!messaging) {
    console.warn('[FCM] Firebase messaging not initialized');
    return null;
  }

  try {
    // Check if service worker is available
    if (!('serviceWorker' in navigator)) {
      console.warn('[FCM] Service Workers not supported');
      return null;
    }

    const currentConfig = resolveFirebaseConfig();

    // Register the unified service worker (sw.js handles both caching and FCM)
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[FCM] Service Worker registered:', registration.scope);
    } catch (swError) {
      console.warn('[FCM] Failed to register service worker:', swError.message);
    }

    const serviceWorkerRegistration = registration || await navigator.serviceWorker.ready;

    // Send Firebase config to the service worker so it can initialize FCM
    if (serviceWorkerRegistration?.active) {
      serviceWorkerRegistration.active.postMessage({ type: 'INIT_FCM', config: currentConfig });
    }

    const token = await getToken(messaging, {
      serviceWorkerRegistration,
      vapidKey: currentConfig.vapidKey,
    });

    if (token) {
      console.log('[FCM] Token received:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('[FCM] No token generated');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error requesting token:', error.message);
    return null;
  }
};

export const listenForFcmMessages = (callback) => {
  if (!messaging) {
    console.warn('[FCM] Firebase messaging not initialized');
    return null;
  }

  try {
    return onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload);

      const notificationData = {
        title: payload.notification?.title || 'Delivo',
        message: payload.notification?.body || 'New update',
        data: payload.data || {},
      };

      if (callback) {
        callback(notificationData);
      }

      // Also show a native notification for foreground messages
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notificationData.title, {
          body: notificationData.message,
          icon: '/delivos.png',
          data: notificationData.data,
        });
      }
    });
  } catch (error) {
    console.error('[FCM] Error listening for messages:', error.message);
    return null;
  }
};

export const saveFcmToken = async (fcmToken, userId) => {
  if (!fcmToken || !userId) {
    return null;
  }

  try {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      console.warn('[FCM] No auth token found, cannot save FCM token to backend');
      return null;
    }

    // Use the same API URL resolution as the main api module
    let apiBase = '/api';
    if (!import.meta.env.DEV) {
      const rawUrl = import.meta.env.VITE_API_URL?.trim();
      if (rawUrl) {
        apiBase = rawUrl.replace(/\/+$/, '');
      }
    }

    const response = await fetch(`${apiBase}/notifications/fcm/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        fcmToken,
        userId,
        platform: 'web',
      }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('[FCM] Token saved to backend');
      return result;
    }

    console.warn('[FCM] Failed to save token:', result.message);
    return null;
  } catch (error) {
    console.error('[FCM] Error saving token:', error.message);
    return null;
  }
};

export const requestNotificationPermissionAndRegister = async () => {
  try {
    if (!('Notification' in window)) {
      console.warn('[FCM] Browser notifications not supported');
      return null;
    }

    if (Notification.permission === 'denied') {
      console.warn('[FCM] Notifications blocked by user');
      return null;
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('[FCM] User declined notification permission');
        return null;
      }
      console.log('[FCM] Notification permission granted');
    }

    const token = await requestFcmToken();
    if (token) {
      console.log('[FCM] Token obtained after permission granted');
      return token;
    }

    return null;
  } catch (error) {
    console.error('[FCM] Error requesting notification permission:', error.message);
    return null;
  }
};

export default {
  initializeFirebase,
  getMessagingInstance,
  requestFcmToken,
  listenForFcmMessages,
  saveFcmToken,
  requestNotificationPermissionAndRegister,
};
