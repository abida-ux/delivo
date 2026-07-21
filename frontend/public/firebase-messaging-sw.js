// Firebase Cloud Messaging Service Worker
// Handles background push notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');

// Firebase configuration (loaded from environment)
const firebaseConfig = {
  apiKey: 'AIzaSyExample', // Will be replaced at build time
  authDomain: 'delivo-example.firebaseapp.com',
  projectId: 'delivo-example',
  storageBucket: 'delivo-example.appspot.com',
  messagingSenderId: 'example',
  appId: 'example',
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
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
  });

  // Handle notification click
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

  console.log('✅ Firebase Messaging Service Worker initialized');
} catch (error) {
  console.error('❌ Firebase Messaging Service Worker error:', error);
}
