import { useState, useEffect, useContext } from 'react';
import { ArrowLeft, Save, RotateCcw, Bell, Lock, Globe, Package, User, Download, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { savePushSubscription } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import LocationPickerModal from '../components/LocationPickerModal';
import './Settings.css';
import SEO from '../components/SEO';

const Settings = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const userId = user?.id || user?._id;
  const settingsKey = userId ? `delivo_settings_${userId}` : 'delivo_settings';

  const [settings, setSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem(settingsKey);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return {
            notifications: true,
            emailNotifications: true,
            privacyMode: false,
            language: 'en',
            theme: 'light',
            location: true,
            darkMode: false,
            checkoutProfile: {
              fullName: '',
              phone: '',
              address: '',
              nearbyLandmark: '',
            },
            ...parsed,
          };
        }
      }
    } catch (e) {}
    return {
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
  const [pushBusy, setPushBusy] = useState(false);
  const [pushNotice, setPushNotice] = useState('');

  const { location } = useLocation();
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  useEffect(() => {
    if (location?.formattedAddress) {
      setSettings((prev) => {
        const finalAddressStr = location.nearbyLandmark 
          ? `${location.formattedAddress} (${location.nearbyLandmark})`
          : location.formattedAddress;

        if (prev.checkoutProfile.address === finalAddressStr) return prev;

        return {
          ...prev,
          checkoutProfile: {
            ...prev.checkoutProfile,
            address: finalAddressStr
          }
        };
      });
      setHasChanges(true);
    }
  }, [location?.formattedAddress, location?.nearbyLandmark]);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(settingsKey);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch (e) {}
  }, [settingsKey]);

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
    if (!buffer) return '';
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
          setPushNotice('Browser push is enabled locally.');
        } else {
          setPushNotice('');
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription && vapidPublicKey) {
          const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });
        }

        if (subscription) {
          const rawP256dh = subscription.getKey ? subscription.getKey('p256dh') : null;
          const rawAuth = subscription.getKey ? subscription.getKey('auth') : null;
          const p256dh = arrayBufferToBase64(rawP256dh);
          const authKey = arrayBufferToBase64(rawAuth);

          await savePushSubscription({
            endpoint: subscription.endpoint,
            keys: { p256dh, auth: authKey },
          });
        }
      } catch (err) {
        console.warn('Push subscription notice:', err.message);
      } finally {
        setPushBusy(false);
      }
    }
  };

  const handleToggle = (key) => {
    const nextValue = !settings[key];
    if (key === 'notifications') {
      handlePushSubscription(nextValue);
    }
    setSettings((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
    setHasChanges(true);
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

  const handleInstallFromSettings = () => {
    if (window.deferredPwaPrompt) {
      window.deferredPwaPrompt.prompt();
      return;
    }
    setShowDownloadConfirm(true);
  };

  const confirmDownloadApp = () => {
    setShowDownloadConfirm(false);
    alert('App install prompt will trigger when available on your browser!');
  };

  const handleViewOrders = (filter) => {
    navigate(`/customer/orders${filter ? `?filter=${filter}` : ''}`);
  };

  return (
    <div className="settings-page">
      <SEO
        title="My Profile"
        description="Manage your account profile, delivery addresses, preferences, and security settings on Delivo."
      />
      <div className="settings-inner">
        <div className="settings-top-bar">
          <button className="settings-back-btn" onClick={() => navigate(-1)} title="Go Back">
            <ArrowLeft size={18} />
          </button>
          <h1 className="settings-page-title">Settings</h1>
        </div>

        {/* Notifications Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Bell size={18} />
            </div>
            <h2 className="settings-card-title">Notifications</h2>
          </div>

          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-row-label">
                <h4>Push Notifications</h4>
                <p>Receive push notifications for orders and updates</p>
                {pushNotice && <p style={{ color: 'var(--color-orange)', fontSize: 12, marginTop: 4 }}>{pushNotice}</p>}
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  disabled={pushBusy}
                  onChange={() => handleToggle('notifications')}
                />
                <span className="toggle-track"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-row-label">
                <h4>Email Notifications</h4>
                <p>Get email updates about your deliveries</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={() => handleToggle('emailNotifications')}
                />
                <span className="toggle-track"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Lock size={18} />
            </div>
            <h2 className="settings-card-title">Privacy & Security</h2>
          </div>

          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-row-label">
                <h4>Share Location</h4>
                <p>Allow Delivo to access your location for better delivery</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.location}
                  onChange={() => handleToggle('location')}
                />
                <span className="toggle-track"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Globe size={18} />
            </div>
            <h2 className="settings-card-title">Preferences</h2>
          </div>

          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-row-label">
                <h4>Language</h4>
                <p>Choose your preferred language</p>
              </div>
              <select
                value={settings.language}
                onChange={(e) => handleSelectChange('language', e.target.value)}
                className="settings-input"
                style={{ width: 140 }}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </div>

        {/* Account Profile Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <User size={18} />
            </div>
            <h2 className="settings-card-title">Account Checkout Profile</h2>
          </div>

          <div className="settings-card-body">
            {user ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label className="setting-form-label">Full Name</label>
                  <input
                    type="text"
                    className="settings-input"
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
                <div style={{ position: 'relative' }}>
                  <label className="setting-form-label">Delivery Address</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.checkoutProfile.address}
                      onChange={(e) => {
                        setSettings((prev) => ({
                          ...prev,
                          checkoutProfile: { ...prev.checkoutProfile, address: e.target.value },
                        }));
                        setHasChanges(true);
                      }}
                      placeholder="House, street or landmark"
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setIsLocationPickerOpen(true)}
                      className="settings-input-map-btn"
                      style={{
                        padding: '10px 14px',
                        background: 'var(--color-orange-light)',
                        border: '1px solid rgba(255, 107, 74, 0.15)',
                        color: 'var(--color-orange)',
                        borderRadius: 'var(--radius)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <MapPin size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="setting-form-label">WhatsApp Number</label>
                  <input
                    type="tel"
                    className="settings-input"
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
                <div>
                  <label className="setting-form-label">M-Pesa Number</label>
                  <input
                    type="tel"
                    className="settings-input"
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
              </div>
            ) : (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Please log in to save your checkout profile for prefilled checkout orders.
              </p>
            )}
          </div>
        </div>

        {/* Delivo PWA Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Download size={18} />
            </div>
            <h2 className="settings-card-title">Delivo Mobile Web App</h2>
          </div>

          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-row-label">
                <h4>Download App</h4>
                <p>Install Delivo on your device home screen for instant access</p>
              </div>
              <button className="settings-save-btn" type="button" onClick={handleInstallFromSettings}>
                Install App
              </button>
            </div>
          </div>
        </div>

        {/* Orders & Quick Actions */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Package size={18} />
            </div>
            <h2 className="settings-card-title">Orders & Quick Actions</h2>
          </div>

          <div className="settings-card-body" style={{ flexDirection: 'row', gap: 'var(--space-3)' }}>
            <button className="btn-secondary" onClick={() => handleViewOrders()}>
              View All Orders
            </button>
            <button className="btn-secondary" onClick={() => handleViewOrders('failed')}>
              View Failed Orders
            </button>
          </div>
        </div>

        {/* Global Actions */}
        <div className="settings-action-bar">
          <button className="settings-save-btn" onClick={handleSaveSettings}>
            <Save size={16} />
            <span>Save Settings</span>
          </button>
          <button className="settings-danger-btn" onClick={handleResetSettings}>
            <RotateCcw size={16} />
            <span>Reset to Default</span>
          </button>
        </div>

        {showDownloadConfirm && (
          <div className="mkt-modal-backdrop" onClick={() => setShowDownloadConfirm(false)}>
            <div className="mkt-modal-container" onClick={(e) => e.stopPropagation()}>
              <h3 className="mkt-modal-title">Download Delivo App?</h3>
              <p className="mkt-modal-subtext" style={{ marginTop: 8 }}>
                Do you want to install Delivo on your mobile home screen?
              </p>
              <div className="mkt-modal-actions">
                <button className="mkt-btn-cancel" onClick={() => setShowDownloadConfirm(false)}>
                  Cancel
                </button>
                <button className="mkt-btn-confirm" onClick={confirmDownloadApp}>
                  Install
                </button>
              </div>
            </div>
          </div>
        )}

        {hasChanges && (
          <div className="settings-unsaved-bar">
            <span>You have unsaved changes.</span>
            <button onClick={handleSaveSettings}>Save Now</button>
          </div>
        )}
      </div>
      <LocationPickerModal 
        isOpen={isLocationPickerOpen} 
        onClose={() => setIsLocationPickerOpen(false)} 
      />
    </div>
  );
};

export default Settings;
