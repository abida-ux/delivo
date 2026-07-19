import { useEffect, useState } from 'react';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [swWaiting, setSwWaiting] = useState(null);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return undefined;

    if (!('serviceWorker' in navigator)) return undefined;

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register(`/sw.js?v=${Date.now()}`);

        // handle updatefound
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // new update available
                setSwWaiting(reg.waiting || newWorker);
              }
            });
          }
        });

        // if already waiting
        if (reg.waiting) setSwWaiting(reg.waiting);
      } catch (error) {
        console.error('Service worker registration failed', error);
      }
    };

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      // don't show immediate big banner; show small CTA in header instead
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
      // show small CTA after a short delay if no beforeinstallprompt fired
      if (!deferredPrompt) setIsVisible(true);
    }, 8000);

    const onControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener && navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      navigator.serviceWorker.removeEventListener && navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleUpdate = () => {
    if (!swWaiting) return;
    swWaiting.postMessage({ type: 'SKIP_WAITING' });
  };

  // Small top-right CTA (doesn't cover bottom nav on mobile)
  return (
    <>
      {isVisible && (
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 9999 }}>
          {deferredPrompt ? (
            <button
              className="pwa-install-cta"
              onClick={handleInstall}
              style={{
                background: '#f97316',
                color: '#fff',
                border: 'none',
                padding: '8px 10px',
                borderRadius: 10,
                boxShadow: '0 6px 14px rgba(0,0,0,0.12)'
              }}
            >
              Install
            </button>
          ) : (
            <button
              className="pwa-install-cta"
              onClick={() => setIsVisible(false)}
              style={{
                background: 'transparent',
                color: '#111827',
                border: '1px solid #e5e7eb',
                padding: '6px 8px',
                borderRadius: 10
              }}
            >
              Add
            </button>
          )}
        </div>
      )}

      {swWaiting && (
        <div style={{ position: 'fixed', top: 56, right: 12, zIndex: 9999 }}>
          <button
            onClick={handleUpdate}
            style={{
              background: '#111827',
              color: '#fff',
              border: 'none',
              padding: '6px 10px',
              borderRadius: 10,
              boxShadow: '0 6px 14px rgba(0,0,0,0.12)'
            }}
          >
            Update available — Refresh
          </button>
        </div>
      )}
    </>
  );
};

export default PwaInstallPrompt;
