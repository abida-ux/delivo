import { useEffect, useState } from 'react';

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [swWaiting, setSwWaiting] = useState(null);
  const [neverShow, setNeverShow] = useState(() => localStorage.getItem('delivo_pwa_never_show') === 'true');
  const [installHintVisible, setInstallHintVisible] = useState(false);
  const [showNeverShowMessage, setShowNeverShowMessage] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return undefined;

    if (!('serviceWorker' in navigator)) return undefined;

    if (neverShow) {
      setIsVisible(false);
    }

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register(`/sw.js?v=${Date.now()}`);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setSwWaiting(reg.waiting || newWorker);
              }
            });
          }
        });

        if (reg.waiting) setSwWaiting(reg.waiting);
      } catch (error) {
        console.error('Service worker registration failed', error);
      }
    };

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      if (!neverShow) {
        setIsVisible(true);
      }
    };

    const handleShowInstallPrompt = (event) => {
      const manual = event?.detail?.manual;
      if (neverShow && !manual) return;
      setIsVisible(true);
    };

    const handleInstallFromSettings = () => {
      setIsVisible(true);
      if (!deferredPrompt) {
        setMessage('Your browser may show the install option from the address bar. Choose Install to download Delivo.');
        return;
      }

      handleInstall();
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('delivo-show-install', handleShowInstallPrompt);
    window.addEventListener('delivo-install-app', handleInstallFromSettings);

    registerServiceWorker();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('delivo-show-install', handleShowInstallPrompt);
      window.removeEventListener('delivo-install-app', handleInstallFromSettings);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setMessage('If installation is not available here, open Settings and tap Download App.');
      return;
    }

    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsVisible(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
      setMessage('Install is not available right now. You can still use the Download App option from Settings.');
    }
  };

  const handleNeverShow = () => {
    localStorage.setItem('delivo_pwa_never_show', 'true');
    setNeverShow(true);
    setIsVisible(false);
    setDeferredPrompt(null);
    setInstallHintVisible(true);
    setShowNeverShowMessage(true);
    setMessage('You can always download the Delivo app from the Download App button in Settings.');
  };

  const handleDismissHint = () => {
    setInstallHintVisible(false);
    setShowNeverShowMessage(false);
    setMessage('');
  };

  const handleUpdate = () => {
    if (!swWaiting) return;
    swWaiting.postMessage({ type: 'SKIP_WAITING' });
  };

  // Small bottom CTA and manual install hint
  return (
    <>
      {(isVisible || installHintVisible || showNeverShowMessage) && (
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
                  {message || 'You can always download the Delivo app from the Download App button in Settings.'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    onClick={handleDismissHint}
                    style={{
                      background: '#f97316',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Got it
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
    </>
  );
};

export default PwaInstallPrompt;
