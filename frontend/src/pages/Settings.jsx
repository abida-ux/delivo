import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, RotateCcw, Bell, Lock, Globe, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { savePushSubscription } from '../services/api';
import './pages.css';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('delivo_settings');
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
        };
  });

  const [hasChanges, setHasChanges] = useState(false);
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

        if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) {
          setPushNotice('Browser push is enabled locally, but the backend still needs VAPID keys for real delivery.');
        } else {
          setPushNotice('');
        }

        const registration = await navigator.serviceWorker.ready;
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
    localStorage.setItem('delivo_settings', JSON.stringify(settings));
  }, [settings]);

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
    localStorage.setItem('delivo_settings', JSON.stringify(settings));
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
      };
      setSettings(defaultSettings);
      localStorage.setItem('delivo_settings', JSON.stringify(defaultSettings));
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
