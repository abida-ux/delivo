// Firebase Cloud Messaging Service Worker
// Handles background push notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');

let firebaseInitialized = false;
let messaging = null;

const handleBackgroundMessage = (payload) => {
  console.log('[firebase-messaging-sw] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Delivo Update';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
};

const initFirebase = (firebaseConfig) => {
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
    console.log('✅ Firebase Messaging Service Worker initialized');
  } catch (error) {
    console.error('❌ Firebase Messaging Service Worker init error:', error);
  }
};

self.addEventListener('message', (event) => {
  if (event.data?.type === 'INIT_FCM') {
    initFirebase(event.data.config);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw] Notification clicked:', event.notification);

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
        if (client.url === '/' || client.url.includes('delivo')) {
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
