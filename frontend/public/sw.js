// Delivo Unified Service Worker
// Handles: Caching, Web Push API, Firebase Cloud Messaging background messages

// Firebase Cloud Messaging compat (for background FCM notifications)
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

const CACHE_NAME = 'delivo-cache-v3';
const APP_SHELL = ['/manifest.webmanifest', '/delivos.png'];

// ==================== Firebase FCM Setup ====================
let firebaseInitialized = false;
let fcmMessaging = null;

// Fallback config must match the active Firebase project (web-push-e48bc)
const fallbackFirebaseConfig = {
  apiKey: 'AIzaSyA41-p0LVWmexu4jPS48a7UF6iXMVmRlt8',
  authDomain: 'web-push-e48bc.firebaseapp.com',
  projectId: 'web-push-e48bc',
  storageBucket: 'web-push-e48bc.firebasestorage.app',
  messagingSenderId: '653494159220',
  appId: '1:653494159220:web:1bba64e4015c4d2f714e21',
  measurementId: 'G-QCY4PMD9XS',
};

function initFirebase(config) {
  if (firebaseInitialized) {
    return;
  }

  const firebaseConfig = config || fallbackFirebaseConfig;
  if (!firebaseConfig.projectId || !firebaseConfig.messagingSenderId || !firebaseConfig.appId) {
    console.warn('[sw] Firebase config incomplete, waiting for INIT_FCM from client');
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    fcmMessaging = firebase.messaging();

    // Handle FCM background messages (when tab is not in focus)
    fcmMessaging.onBackgroundMessage((payload) => {
      console.log('[sw] FCM background message received:', payload);

      const title = payload.notification?.title || 'Delivo Update';
      const options = {
        body: payload.notification?.body || 'You have a new update',
        icon: '/delivos.png',
        badge: '/delivos.png',
        data: payload.data || {},
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'close', title: 'Close' },
        ],
      };

      self.registration.showNotification(title, options).then(() => {
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'DELIVO_PUSH_RECEIVED', payload });
          });
        });
      });
    });

    firebaseInitialized = true;
    console.log('[sw] Firebase Messaging initialized successfully');
  } catch (error) {
    console.error('[sw] Firebase init error:', error?.message || error);
  }
}

// Attempt immediate init with fallback config
try {
  initFirebase(fallbackFirebaseConfig);
} catch (e) {
  console.warn('[sw] Deferred Firebase init, awaiting INIT_FCM message from client');
}

// ==================== Service Worker Lifecycle ====================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// ==================== Message Handler ====================
self.addEventListener('message', (event) => {
  const type = event.data?.type;

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Accept Firebase config from the client to (re-)initialize FCM
  if (type === 'INIT_FCM') {
    initFirebase(event.data.config);
    return;
  }

  // Development helper: show a test notification via postMessage
  if (type === 'SHOW_TEST_NOTIFICATION') {
    try {
      const payload = event.data.payload || {};
      const title = payload.title || 'Delivo SW Test';
      const options = {
        body: payload.body || 'Service worker test notification',
        icon: payload.icon || '/delivos.png',
        data: payload.data || {},
      };
      self.registration.showNotification(title, options);
      self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SHOW_TEST_NOTIFICATION_RESULT', success: true }));
      });
    } catch (e) {
      self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SHOW_TEST_NOTIFICATION_RESULT', success: false, error: String(e) }));
      });
    }
  }
});

// ==================== Web Push API (VAPID-based) ====================
self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data && event.data.text() ? JSON.parse(event.data.text()) : {};
  } catch (error) {
    payload = {};
  }

  const title = payload.title || 'Delivo Notification';

  const options = {
    body: payload.message || 'You have a new update from Delivo.',
    icon: '/delivos.png',
    badge: '/delivos.png',
    tag: payload.tag || 'delivo-push-alert',
    vibrate: [200, 100, 200],
    data: payload,
  };


  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'DELIVO_PUSH_RECEIVED', payload });
        });
      });
    })
  );

});

// ==================== Notification Click ====================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const clickAction = data.clickAction || data.url || '/';
  const orderId = data.orderId || '';
  const recipientRole = data.recipientRole || '';

  let targetUrl = clickAction;

  if (orderId && orderId !== 'test-notification') {
    if (recipientRole === 'rider') {
      targetUrl = `/rider/deliveries?orderId=${orderId}`;
    } else if (recipientRole === 'restaurant') {
      targetUrl = `/restaurant/orders?orderId=${orderId}`;
    } else if (recipientRole === 'admin') {
      targetUrl = `/admin/orders?orderId=${orderId}`;
    } else {
      targetUrl = `/customer/orders/${orderId}`;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i += 1) {
        const client = windowClients[i];
        if ('focus' in client) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});

// ==================== Fetch / Caching ====================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // CRITICAL FIX: Do NOT intercept requests in local development (Vite HMR & dev server)
  if (
    requestUrl.hostname === 'localhost' ||
    requestUrl.hostname === '127.0.0.1' ||
    requestUrl.port === '5173' ||
    requestUrl.pathname.startsWith('/@') ||
    requestUrl.pathname.startsWith('/src/') ||
    requestUrl.pathname.startsWith('/node_modules/')
  ) {
    return; // Allow direct fetch from Vite dev server without Service Worker caching
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for navigation / HTML requests
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // Cache-first for other static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        const responseCopy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
        return networkResponse;
      });
    })
  );
});

