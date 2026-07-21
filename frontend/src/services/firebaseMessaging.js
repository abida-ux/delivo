import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration - from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

let firebaseApp = null;
let messaging = null;
let analytics = null;

export const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (!firebaseConfig.projectId) {
    console.warn('⚠️ Firebase config incomplete. FCM notifications will not work.');
    console.warn('   Set VITE_FIREBASE_* environment variables to enable FCM.');
    return null;
  }

  try {
    firebaseApp = initializeApp(firebaseConfig);
    messaging = getMessaging(firebaseApp);
    analytics = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? getAnalytics(firebaseApp) : null;
    console.log('✅ Firebase initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
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
    console.warn('⚠️ Firebase messaging not initialized');
    return null;
  }

  try {
    // Check if service worker is available
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Workers not supported');
      return null;
    }

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
    };

    let registration;
    try {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Firebase Service Worker registered');
    } catch (swError) {
      console.warn('⚠️ Failed to register Firebase service worker:', swError.message);
    }

    const readyRegistration = await navigator.serviceWorker.ready;
    if (readyRegistration?.active) {
      readyRegistration.active.postMessage({ type: 'INIT_FCM', config: firebaseConfig });
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: readyRegistration,
    });

    if (token) {
      console.log('✅ FCM token received:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('⚠️ No FCM token generated');
      return null;
    }
  } catch (error) {
    console.error('❌ Error requesting FCM token:', error.message);
    return null;
  }
};

export const listenForFcmMessages = (callback) => {
  if (!messaging) {
    console.warn('⚠️ Firebase messaging not initialized');
    return null;
  }

  try {
    return onMessage(messaging, (payload) => {
      console.log('📬 Foreground FCM message received:', payload);

      const notificationData = {
        title: payload.notification?.title || 'Delivo',
        message: payload.notification?.body || 'New update',
        data: payload.data || {},
      };

      if (callback) {
        callback(notificationData);
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notificationData.title, {
          body: notificationData.message,
          icon: '/favicon.ico',
          data: notificationData.data,
        });
      }
    });
  } catch (error) {
    console.error('❌ Error listening for FCM messages:', error.message);
    return null;
  }
};

export const saveFcmToken = async (fcmToken, userId) => {
  if (!fcmToken || !userId) {
    return null;
  }

  try {
    const response = await fetch('/api/notifications/fcm/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        fcmToken,
        userId,
        platform: 'web',
      }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ FCM token saved to database');
      return result;
    }

    console.warn('⚠️ Failed to save FCM token:', result.message);
    return null;
  } catch (error) {
    console.error('❌ Error saving FCM token:', error.message);
    return null;
  }
};

export default {
  initializeFirebase,
  getMessagingInstance,
  requestFcmToken,
  listenForFcmMessages,
  saveFcmToken,
};
