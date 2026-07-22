import { useState, useEffect, useContext } from 'react';
import { ArrowLeft, Save, RotateCcw, Bell, Lock, Globe, Package, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { savePushSubscription } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './pages.css';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const userId = user?.id || user?._id;
  const settingsKey = userId ? `delivo_settings_${userId}` : 'delivo_settings';

  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem(settingsKey);
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          notifications: true,
          emailNotifications: true,
          privacyMode: false,
          language: 'en',
          theme: 'light',
          location: true,
          darkMode: false,
          checkoutProfile: {
            fullName: '',
            address: '',
            whatsapp: '',
            mpesaNumber: '',
          },
        };
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem(settingsKey);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [settingsKey]);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushNotice, setPushNotice] = useState('');

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

  const handlePushSubscription = async (enabled) => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSettings((prev) => ({ ...prev, notifications: false }));
      setHasChanges(true);
      alert('Push notifications are not supported in this browser.');
      return;
    }

    if (enabled) {
      try {
        setPushBusy(true);
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
          throw new Error('Notification permission was not granted.');
        }

        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
        if (!vapidPublicKey) {
          setPushNotice('Browser push is enabled locally, but the frontend still needs a public VAPID key to register a live browser subscription.');
        } else {
          setPushNotice('');
        }

        const registration = await navigator.serviceWorker.ready;
        const options = {
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        };

        const subscription = await registration.pushManager.subscribe(options);
        await savePushSubscription({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: arrayBufferToBase64(subscription.getKey('auth')),
          },
        });
      } catch (error) {
        console.error('Push subscription failed:', error);
        setSettings((prev) => ({ ...prev, notifications: false }));
        setHasChanges(true);
        setPushNotice('Push notification permission could not be enabled.');
        alert('Unable to enable push notifications right now.');
      } finally {
        setPushBusy(false);
      }
    } else {
      try {
        setPushBusy(true);
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();

        if (existingSubscription) {
          await existingSubscription.unsubscribe();
        }
      } catch (error) {
        console.error('Push unsubscription failed:', error);
      } finally {
        setPushBusy(false);
      }
    }

    if (!enabled) {
      setPushNotice('');
    }
  };

  useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }, [settingsKey, settings]);

  const handleInstallFromSettings = () => {
    setShowDownloadConfirm(true);
  };

  const confirmDownloadApp = () => {
    setShowDownloadConfirm(false);
    window.dispatchEvent(new CustomEvent('delivo-install-app'));
  };

  const handleToggle = async (key) => {
    const nextValue = !settings[key];

    setSettings((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
    setHasChanges(true);

    if (key === 'notifications') {
      await handlePushSubscription(nextValue);
    }
  };

  const handleSelectChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    setHasChanges(false);
    alert('Settings saved successfully!');
    setTimeout(() => navigate(-1), 1500);
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings = {
        notifications: true,
        emailNotifications: true,
        privacyMode: false,
        language: 'en',
        theme: 'light',
        location: true,
        darkMode: false,
        checkoutProfile: {
          fullName: '',
          address: '',
          whatsapp: '',
          mpesaNumber: '',
        },
      };
      setSettings(defaultSettings);
      localStorage.setItem(settingsKey, JSON.stringify(defaultSettings));
      setHasChanges(false);
    }
  };

  const handleViewOrders = (filter) => {
    navigate(`/customer/orders${filter ? `?filter=${filter}` : ''}`);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="settings-title">Settings</h1>
        <div style={{ width: '24px' }}></div>
      </div>

      <div className="settings-content">
        {/* Notifications Section */}
        <div className="settings-section">
          <div className="section-header">
            <Bell size={20} />
            <h2>Notifications</h2>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Push Notifications</label>
              <p className="setting-description">
                Receive push notifications for orders and updates
              </p>
              {pushNotice && <p className="setting-description" style={{ color: '#f59e0b', marginTop: '4px' }}>{pushNotice}</p>}
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.notifications}
                disabled={pushBusy}
                onChange={() => handleToggle('notifications')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Email Notifications</label>
              <p className="setting-description">
                Get email updates about your deliveries
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="settings-section">
          <div className="section-header">
            <Lock size={20} />
            <h2>Privacy & Security</h2>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Privacy Mode</label>
              <p className="setting-description">
                Hide your activity from other users
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.privacyMode}
                onChange={() => handleToggle('privacyMode')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Share Location</label>
              <p className="setting-description">
                Allow Delivo to access your location for better delivery
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.location}
                onChange={() => handleToggle('location')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="settings-section">
          <div className="section-header">
            <Globe size={20} />
            <h2>Preferences</h2>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Language</label>
              <p className="setting-description">Choose your preferred language</p>
            </div>
            <select
              value={settings.language}
              onChange={(e) => handleSelectChange('language', e.target.value)}
              className="setting-select"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Theme</label>
              <p className="setting-description">Choose your preferred theme</p>
            </div>
            <select
              value={settings.theme}
              onChange={(e) => handleSelectChange('theme', e.target.value)}
              className="setting-select"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <User size={20} />
            <h2>Account Settings</h2>
          </div>
          {user ? (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={settings.checkoutProfile.fullName}
                  onChange={(e) => {
                    setSettings((prev) => ({
                      ...prev,
                      checkoutProfile: { ...prev.checkoutProfile, fullName: e.target.value },
                    }));
                    setHasChanges(true);
                  }}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label>Delivery Address</label>
                <input
                  type="text"
                  value={settings.checkoutProfile.address}
                  onChange={(e) => {
                    setSettings((prev) => ({
                      ...prev,
                      checkoutProfile: { ...prev.checkoutProfile, address: e.target.value },
                    }));
                    setHasChanges(true);
                  }}
                  placeholder="House, apartment, street or landmark"
                />
              </div>
              <div className="form-group">
                <label>WhatsApp Number</label>
                <input
                  type="tel"
                  value={settings.checkoutProfile.whatsapp}
                  onChange={(e) => {
                    setSettings((prev) => ({
                      ...prev,
                      checkoutProfile: { ...prev.checkoutProfile, whatsapp: e.target.value },
                    }));
                    setHasChanges(true);
                  }}
                  placeholder="0722 000 000"
                />
              </div>
              <div className="form-group">
                <label>M-Pesa Number</label>
                <input
                  type="tel"
                  value={settings.checkoutProfile.mpesaNumber}
                  onChange={(e) => {
                    setSettings((prev) => ({
                      ...prev,
                      checkoutProfile: { ...prev.checkoutProfile, mpesaNumber: e.target.value },
                    }));
                    setHasChanges(true);
                  }}
                  placeholder="0722 000 000"
                />
              </div>
              <p className="setting-description" style={{ marginTop: '8px' }}>
                Your saved account details will be prefilled during checkout whenever you place an order.
              </p>
            </>
          ) : (
            <div className="account-empty-note">
              <p>Please log in to save your checkout profile. Saved account details will be prefilled at checkout for faster orders.</p>
            </div>
          )}
        </div>

        <div className="settings-section">
          <div className="section-header">
            <Package size={20} />
            <h2>Delivo App</h2>
          </div>
          <div className="setting-item install-section">
            <div className="setting-info">
              <label>Download App</label>
              <p className="setting-description">
                Install Delivo on your device for faster access. If you hide the prompt, return here to download it anytime.
              </p>
            </div>
            <button className="download-app-btn" type="button" onClick={handleInstallFromSettings}>
              Download App
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="settings-section">
          <div className="section-header">
            <Package size={20} />
            <h2>Orders & Quick Actions</h2>
          </div>
          <div className="orders-actions">
            <button className="quick-order-btn" onClick={() => handleViewOrders()}>View All Orders</button>
            <button className="quick-order-btn" onClick={() => handleViewOrders('failed')}>View Failed Orders</button>
          </div>
        </div>

        <div className="settings-actions">
          <button className="save-btn" onClick={handleSaveSettings}>
            <Save size={18} />
            Save Settings
          </button>
          <button className="reset-btn" onClick={handleResetSettings}>
            <RotateCcw size={18} />
            Reset to Default
          </button>
        </div>

        {showDownloadConfirm && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              zIndex: 99999,
            }}
          >
            <div
              style={{
                width: 'min(92vw, 420px)',
                background: '#fff',
                borderRadius: 16,
                padding: 20,
                boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#111827' }}>
                Download Delivo app?
              </div>
              <div style={{ fontSize: 14, color: '#4b5563', marginBottom: 18 }}>
                Do you want to download Delivo app?
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowDownloadConfirm(false)}
                  style={{
                    background: '#e5e7eb',
                    color: '#111827',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={confirmDownloadApp}
                  style={{
                    background: '#f97316',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {hasChanges && (
          <div className="unsaved-changes-banner">
            You have unsaved changes. Click "Save Settings" to apply them.
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
