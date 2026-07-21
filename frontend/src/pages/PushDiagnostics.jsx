import { useEffect, useState } from 'react';
import {
  initializeFirebase,
  requestFcmToken,
  listenForFcmMessages,
} from '../services/firebaseMessaging';

export default function PushDiagnostics() {
  const [firebaseInited, setFirebaseInited] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [permission, setPermission] = useState(Notification.permission);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const app = initializeFirebase();
        setFirebaseInited(!!app);

        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('✅ SW registered:', reg.scope);
            setSwRegistered(true);
          } catch (swErr) {
            console.error('❌ SW register failed:', swErr);
            setError(swErr.message || String(swErr));
          }
        }

        if ('Notification' in window) {
          setPermission(Notification.permission);
        }

        // listen for foreground messages
        try {
          listenForFcmMessages((payload) => {
            console.log('📬 Foreground message', payload);
          });
        } catch (listenErr) {
          console.warn('Could not attach foreground listener', listenErr);
        }
      } catch (err) {
        console.error('Init error', err);
        setError(err.message || String(err));
      }
    })();
  }, []);

  const handleRequestPermission = async () => {
    try {
      let p = Notification.permission;
      if (p === 'default') p = await Notification.requestPermission();
      setPermission(p);

      if (p === 'granted') {
        const t = await requestFcmToken();
        setToken(t);
        console.log('✅ FCM token:', t);
      }
    } catch (err) {
      console.error('Permission/token error', err);
      setError(err.message || String(err));
    }
  };

  const copyToken = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      alert('Token copied to clipboard');
    } catch (err) {
      console.error('Copy failed', err);
      setError(err.message || String(err));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Push Diagnostics</h2>
      <ul>
        <li><strong>Firebase initialized:</strong> {firebaseInited ? '✅' : '❌'}</li>
        <li><strong>Service Worker registered:</strong> {swRegistered ? '✅' : '❌'}</li>
        <li><strong>Notification permission:</strong> {permission}</li>
        <li><strong>FCM token:</strong> {token ? (<>{token} <button onClick={copyToken}>Copy</button></>) : '—'}</li>
        <li><strong>Errors:</strong> {error || 'None'}</li>
      </ul>

      <div style={{ marginTop: 12 }}>
        <button onClick={handleRequestPermission}>Request Permission & Get Token</button>
      </div>

      <p style={{ marginTop: 12, color: '#666' }}>
        Open the browser console to see detailed logs. After you get a token, paste it into Firebase Console → Cloud Messaging → Send your own message (Single device).
      </p>
    </div>
  );
}
