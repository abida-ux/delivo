import { useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import Loader from "./components/Loader";
import AuthModal from "./components/AuthModal";
import { LoaderContext } from "./context/LoaderContext";
import { savePushSubscription } from './services/api';
import './styles/global.css';
import './components/Loader.css';

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

const registerBrowserPushSubscription = async () => {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return;
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    const options = { userVisibleOnly: true };

    if (vapidPublicKey) {
      options.applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    }

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

const triggerRefreshNotification = async () => {
  if (!('Notification' in window)) return;

  const permission = Notification.permission;
  if (permission !== 'granted') {
    try {
      await Notification.requestPermission();
    } catch {
      return;
    }
  }

  if (Notification.permission === 'granted') {
    new Notification('Delivo refresh test', {
      body: 'This notification appears on every refresh for testing.',
      icon: '/delivos.png',
      tag: 'delivo-refresh-test',
    });
  }
};

function App() {
  const { isLoading } = useContext(LoaderContext);
  const location = useLocation();

  useEffect(() => {
    triggerRefreshNotification();
    registerBrowserPushSubscription();
  }, [location.pathname]);

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