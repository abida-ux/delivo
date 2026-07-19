import { useEffect, useState } from 'react';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [swWaiting, setSwWaiting] = useState(null);
  const [neverShow, setNeverShow] = useState(() => localStorage.getItem('delivo_pwa_never_show') === 'true');
  const [installHintVisible, setInstallHintVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return undefined;

    if (!('serviceWorker' in navigator)) return undefined;

    if (neverShow) {
      setIsVisible(false);
      setInstallHintVisible(false);
    }

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
      if (!neverShow) setIsVisible(true);
    };

    const handleShowInstallPrompt = (event) => {
      const manual = event?.detail?.manual;
      if (neverShow && !manual) return;
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('delivo-show-install', handleShowInstallPrompt);

    registerServiceWorker();

    const timer = window.setTimeout(() => {
      // show small CTA after a short delay if no beforeinstallprompt fired
      if (!deferredPrompt && !neverShow) {
        setIsVisible(true);
      }
    }, 8000);

    const onControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener && navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('delivo-show-install', handleShowInstallPrompt);
      navigator.serviceWorker.removeEventListener && navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, [deferredPrompt, neverShow]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setMessage('If installation is not available here, open Settings and tap Download App.');
      return;
    }
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleNeverShow = () => {
    localStorage.setItem('delivo_pwa_never_show', 'true');
    setNeverShow(true);
    setIsVisible(false);
    setDeferredPrompt(null);
    setInstallHintVisible(true);
    setMessage('App install is still available in Settings. Tap Download App when you are ready.');
  };

  const handleDismissHint = () => {
    setInstallHintVisible(false);
    setMessage('');
  };

  useEffect(() => {
    if (!installHintVisible) return undefined;
    const hideTimer = window.setTimeout(() => {
      setInstallHintVisible(false);
      setMessage('');
    }, 7000);
    return () => window.clearTimeout(hideTimer);
  }, [installHintVisible]);

  const handleUpdate = () => {
    if (!swWaiting) return;
    swWaiting.postMessage({ type: 'SKIP_WAITING' });
  };

  // Small bottom CTA and manual install hint
  return (
    <>
      {(isVisible || installHintVisible) && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 'min(92vw, 420px)',
          }}
        >
          <div
            style={{
              background: '#111827',
              color: '#fff',
              borderRadius: 18,
              padding: '18px 20px',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.28)',
              display: 'grid',
              gap: 12,
            }}
          >
            {installHintVisible ? (
              <>
                <div style={{ fontSize: 15, lineHeight: 1.6 }}>
                  {message || 'App install is still available in Settings. Tap Download App when you are ready.'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    onClick={handleDismissHint}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.16)',
                      borderRadius: 12,
                      padding: '8px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  Download the Delivo app for faster access
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <button
                    className="pwa-install-cta"
                    onClick={handleInstall}
                    style={{
                      background: '#f97316',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 14px',
                      borderRadius: 14,
                      boxShadow: '0 8px 24px rgba(249,115,22,0.24)',
                      cursor: 'pointer',
                    }}
                  >
                    Install App
                  </button>
                  <button
                    onClick={handleNeverShow}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.18)',
                      borderRadius: 14,
                      padding: '10px 14px',
                      cursor: 'pointer',
                    }}
                  >
                    Never show again
                  </button>
                </div>
                {message && (
                  <div style={{ fontSize: 13, color: '#e5e7eb' }}>{message}</div>
                )}
              </>
            )}
          </div>
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
