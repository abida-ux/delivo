// Firebase Cloud Messaging Service Worker (Legacy Fallback)
// Primary FCM handling has been merged into sw.js
// This file is kept in case any cached references still point here.

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

let firebaseInitialized = false;
let messaging = null;

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

try {
  initFirebase(fallbackFirebaseConfig);
} catch (e) {
  console.warn('[firebase-messaging-sw] Initial init failed, will await client INIT_FCM', e?.message || e);
}

function handleBackgroundMessage(payload) {
  console.log('[firebase-messaging-sw] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Delivo Update';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update',
    icon: '/delivos.png',
    badge: '/delivos.png',
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions).then(() => {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'DELIVO_PUSH_RECEIVED', payload });
      });
    });
  });
}

function initFirebase(firebaseConfig) {
  if (firebaseInitialized) {
    return;
  }

  if (!firebaseConfig || !firebaseConfig.projectId || !firebaseConfig.messagingSenderId || !firebaseConfig.appId) {
    console.warn('[firebase-messaging-sw] Firebase config is missing or incomplete. Waiting for config from client.');
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    messaging.onBackgroundMessage(handleBackgroundMessage);
    firebaseInitialized = true;
    console.log('[firebase-messaging-sw] Firebase Messaging initialized');
  } catch (error) {
    console.error('[firebase-messaging-sw] Init error:', error);
  }
}

self.addEventListener('message', (event) => {
  const type = event.data?.type;
  if (type === 'INIT_FCM') {
    initFirebase(event.data.config);
    return;
  }

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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const clickAction = data.clickAction || '/';
  const orderId = data.orderId || '';
  const recipientRole = data.recipientRole || '';

  let targetUrl = clickAction;

  if (orderId) {
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
