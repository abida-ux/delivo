import { useEffect, useState } from 'react';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      return undefined;
    }

    if (!('serviceWorker' in navigator)) {
      return undefined;
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register(`/sw.js?v=${Date.now()}`);
      } catch (error) {
        console.error('Service worker registration failed', error);
      }
    };

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    registerServiceWorker();

    const timer = window.setTimeout(() => {
      if (!deferredPrompt) {
        setIsVisible(true);
      }
    }, 8000);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '16px',
        transform: 'translateX(-50%)',
        width: 'min(92vw, 440px)',
        padding: '14px 16px',
        background: '#111827',
        color: '#f9fafb',
        borderRadius: '14px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.24)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '15px' }}>Install Delivo</div>
      <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#d1d5db' }}>
        Add Delivo to your home screen for a faster, app-like experience.
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#f9fafb',
            cursor: 'pointer',
            padding: '8px 10px',
            borderRadius: '8px',
          }}
        >
          Maybe later
        </button>
        <button
          type="button"
          onClick={handleInstall}
          style={{
            border: 'none',
            background: '#f97316',
            color: '#fff',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '8px',
            fontWeight: 600,
          }}
        >
          Install
        </button>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
