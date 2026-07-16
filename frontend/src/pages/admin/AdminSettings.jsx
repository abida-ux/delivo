import React, { useState, useEffect, useContext } from 'react';
import {
  Bell,
  Gift,
  Truck,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Send,
  X,
} from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { AuthContext } from '../../context/AuthContext';
import api, { getAppSettings, updateAppSettings } from '../../services/api';
import './AdminSettings.css';

const AdminSettings = () => {
  const { user, token } = useContext(AuthContext);
  
  const [settings, setSettings] = useState({
    promoNotifications: true,
    freeDeliveryEnabled: false,
    freeDeliveryMinimum: 2500,
    deliveryFeeEnabled: true,
    deliveryFeeAmount: 20,
    notificationMessage: 'Free delivery for orders above KES 2,500!',
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [promoCodes, setPromoCodes] = useState([]);
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount: '',
    type: 'percentage', // percentage or fixed
    maxUses: '',
    expiryDate: '',
    active: true,
  });

  const [showPromoForm, setShowPromoForm] = useState(false);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'system',
    userId: '',
  });
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const appSettings = await getAppSettings();
        setSettings({
          promoNotifications: appSettings.promoNotifications ?? true,
          freeDeliveryEnabled: appSettings.freeDeliveryEnabled ?? false,
          freeDeliveryMinimum: appSettings.freeDeliveryMinimum ?? 2500,
          deliveryFeeEnabled: appSettings.deliveryFeeEnabled ?? true,
          deliveryFeeAmount: appSettings.deliveryFeeAmount ?? 20,
          notificationMessage: appSettings.notificationMessage || 'Free delivery for orders above KES 2,500!',
        });

        if (appSettings.promoNotifications) {
          try {
            await api.post('/notifications/create', {
              title: 'Announcement',
              message: appSettings.notificationMessage || 'Free delivery for orders above KES 2,500!',
              type: 'promotion',
              userId: null,
            });
          } catch (err) {
            console.error('Failed to create broadcast notification:', err);
          }
        }

        try {
          localStorage.setItem('app_settings_updated', Date.now().toString());
          window.dispatchEvent(new Event('app_settings_updated'));
        } catch (e) {
          // ignore storage errors
        }
      } catch (error) {
        console.error('Error loading app settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();

    const savedPromos = localStorage.getItem('promoCodes');
    if (savedPromos) {
      setPromoCodes(JSON.parse(savedPromos));
    }
    
    // Fetch notifications from backend
    if (user && token) {
      fetchNotifications();
    }
  }, [user, token]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      setNotificationMessage('Title and message are required');
      setTimeout(() => setNotificationMessage(''), 3000);
      return;
    }

    setNotificationLoading(true);
    try {
      await api.post('/notifications/create', {
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type,
        userId: notificationForm.userId || null,
      });

      setNotificationMessage('✅ Notification sent successfully!');
      setNotificationForm({ title: '', message: '', type: 'system', userId: '' });
      setTimeout(() => setNotificationMessage(''), 3000);
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      setNotificationMessage('❌ Error sending notification');
      setTimeout(() => setNotificationMessage(''), 3000);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('Delete this notification?')) return;
    
    try {
      await api.delete(`/notifications/${notificationId}`);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Save settings to the backend and publish a broadcast notification when enabled
  const saveSettings = async () => {
    try {
      await updateAppSettings(settings);

      if (settings.promoNotifications && settings.notificationMessage?.trim()) {
        try {
          await api.post('/notifications/create', {
            title: 'New offer',
            message: settings.notificationMessage,
            type: 'promotion',
            userId: null,
          });
        } catch (notificationError) {
          console.error('Error creating promo notification:', notificationError);
        }
      }

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddPromo = (e) => {
    e.preventDefault();

    if (!newPromo.code || !newPromo.discount) {
      alert('Please fill in all required fields');
      return;
    }

    const promoToAdd = {
      ...newPromo,
      id: Date.now(),
      uses: 0,
      createdAt: new Date().toLocaleDateString(),
    };

    const updatedPromos = [...promoCodes, promoToAdd];
    setPromoCodes(updatedPromos);
    localStorage.setItem('promoCodes', JSON.stringify(updatedPromos));

    // Reset form
    setNewPromo({
      code: '',
      discount: '',
      type: 'percentage',
      maxUses: '',
      expiryDate: '',
      active: true,
    });
    setShowPromoForm(false);
    alert('Promo code created successfully!');
  };

  const handleDeletePromo = (id) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      const updatedPromos = promoCodes.filter((p) => p.id !== id);
      setPromoCodes(updatedPromos);
      localStorage.setItem('promoCodes', JSON.stringify(updatedPromos));
      alert('Promo code deleted!');
    }
  };

  const togglePromoActive = (id) => {
    const updatedPromos = promoCodes.map((p) =>
      p.id === id ? { ...p, active: !p.active } : p
    );
    setPromoCodes(updatedPromos);
    localStorage.setItem('promoCodes', JSON.stringify(updatedPromos));
  };

  return (
    <AdminDashboardLayout pageTitle="Admin Settings">
      <div className="admin-settings">
        {/* Notifications Section */}
        <section className="settings-section">
          <div className="section-header">
            <Bell size={24} className="section-icon" />
            <h2>Send Notifications</h2>
          </div>

          <div className="settings-content">
            <form className="notification-form" onSubmit={handleSendNotification}>
              <div className="form-group">
                <label htmlFor="notif-title">Title *</label>
                <input
                  type="text"
                  id="notif-title"
                  value={notificationForm.title}
                  onChange={(e) =>
                    setNotificationForm({ ...notificationForm, title: e.target.value })
                  }
                  placeholder="Notification title..."
                  maxLength="50"
                />
                <small>{notificationForm.title.length}/50</small>
              </div>

              <div className="form-group">
                <label htmlFor="notif-message">Message *</label>
                <textarea
                  id="notif-message"
                  value={notificationForm.message}
                  onChange={(e) =>
                    setNotificationForm({ ...notificationForm, message: e.target.value })
                  }
                  placeholder="Notification message..."
                  rows="3"
                  maxLength="500"
                />
                <small>{notificationForm.message.length}/500</small>
              </div>

              <div className="form-group">
                <label htmlFor="notif-type">Type</label>
                <select
                  id="notif-type"
                  value={notificationForm.type}
                  onChange={(e) =>
                    setNotificationForm({ ...notificationForm, type: e.target.value })
                  }
                >
                  <option value="system">System</option>
                  <option value="order">Order</option>
                  <option value="promotion">Promotion</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notif-userid">Send to (User ID - Leave empty for all users)</label>
                <input
                  type="text"
                  id="notif-userid"
                  value={notificationForm.userId}
                  onChange={(e) =>
                    setNotificationForm({ ...notificationForm, userId: e.target.value })
                  }
                  placeholder="User ID (optional)"
                />
              </div>

              <button 
                type="submit" 
                className="send-notification-btn"
                disabled={notificationLoading}
              >
                <Send size={18} />
                {notificationLoading ? 'Sending...' : 'Send Notification'}
              </button>

              {notificationMessage && (
                <div className={`message ${notificationMessage.includes('✅') ? 'success' : 'error'}`}>
                  {notificationMessage}
                </div>
              )}
            </form>

            {/* Sent Notifications List */}
            {notifications.length > 0 && (
              <div className="notifications-history">
                <h3>Recent Notifications ({notifications.length})</h3>
                <div className="notifications-list">
                  {notifications.map((notif) => (
                    <div key={notif._id} className="notification-item">
                      <div className="notification-content">
                        <h4>{notif.title}</h4>
                        <p>{notif.message}</p>
                        <small className="notification-meta">
                          Type: {notif.type} • {new Date(notif.createdAt).toLocaleString()}
                        </small>
                      </div>
                      <button
                        className="delete-notification-btn"
                        onClick={() => handleDeleteNotification(notif._id)}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notifications.length === 0 && (
              <div className="empty-state">
                <Bell size={48} />
                <p>No notifications sent yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Promo Notifications Section */}
        <section className="settings-section">
          <div className="section-header">
            <Gift size={24} className="section-icon" />
            <h2>Promo Notifications</h2>
          </div>

          <div className="settings-content">
            <div className="setting-item">
              <div className="setting-label">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={settings.promoNotifications}
                    onChange={(e) =>
                      handleSettingChange('promoNotifications', e.target.checked)
                    }
                  />
                  <span className="toggle-switch"></span>
                  Enable Promo Notifications
                </label>
                <p className="setting-desc">
                  Send push notifications to all users about active promos and offers
                </p>
              </div>
            </div>

            {settings.promoNotifications && (
              <div className="setting-item">
                <label htmlFor="notification-msg">Notification Message</label>
                <textarea
                  id="notification-msg"
                  value={settings.notificationMessage}
                  onChange={(e) =>
                    handleSettingChange('notificationMessage', e.target.value)
                  }
                  placeholder="Enter notification message..."
                  rows="3"
                />
                <div className="notification-preview">
                  <p className="preview-title">📱 Preview:</p>
                  <div className="preview-box">
                    <p className="preview-content">
                      {settings.notificationMessage || 'Your notification message will appear here...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Free Delivery Section */}
        <section className="settings-section">
          <div className="section-header">
            <Truck size={24} className="section-icon" />
            <h2>Free Delivery Settings</h2>
          </div>

          <div className="settings-content">
            <div className="setting-item">
              <div className="setting-label">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={settings.freeDeliveryEnabled}
                    onChange={(e) =>
                      handleSettingChange('freeDeliveryEnabled', e.target.checked)
                    }
                  />
                  <span className="toggle-switch"></span>
                  Enable Free Delivery Offer
                </label>
                <p className="setting-desc">
                  Activate free delivery for orders above a minimum amount
                </p>
              </div>
            </div>

            {settings.freeDeliveryEnabled && (
              <div className="setting-item">
                <label htmlFor="min-amount">Minimum Order Amount (KES)</label>
                <input
                  type="number"
                  id="min-amount"
                  value={settings.freeDeliveryMinimum}
                  onChange={(e) =>
                    handleSettingChange('freeDeliveryMinimum', parseFloat(e.target.value))
                  }
                  placeholder="Enter minimum amount"
                  min="0"
                />
                <p className="setting-desc">
                  Orders above KES {settings.freeDeliveryMinimum} will get free delivery
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Delivery Fee Section */}
        <section className="settings-section">
          <div className="section-header">
            <Truck size={24} className="section-icon" />
            <h2>Delivery Fee Settings</h2>
          </div>

          <div className="settings-content">
            <div className="setting-item">
              <div className="setting-label">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={settings.deliveryFeeEnabled}
                    onChange={(e) =>
                      handleSettingChange('deliveryFeeEnabled', e.target.checked)
                    }
                  />
                  <span className="toggle-switch"></span>
                  Enable Delivery Fee
                </label>
                <p className="setting-desc">
                  Toggle the fixed delivery fee for all orders.
                </p>
              </div>
            </div>

            {settings.deliveryFeeEnabled && (
              <div className="setting-item">
                <label htmlFor="delivery-fee-amount">Delivery Fee Amount (KES)</label>
                <input
                  type="number"
                  id="delivery-fee-amount"
                  value={settings.deliveryFeeAmount}
                  onChange={(e) =>
                    handleSettingChange('deliveryFeeAmount', parseFloat(e.target.value))
                  }
                  placeholder="20"
                  min="0"
                  step="1"
                />
                <p className="setting-desc">
                  Current delivery fee applied at checkout: KES {settings.deliveryFeeAmount}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Promo Codes Section */}
        <section className="settings-section">
          <div className="section-header">
            <Gift size={24} className="section-icon" />
            <h2>Promo Codes</h2>
          </div>

          <div className="settings-content">
            <button
              className={`add-promo-btn ${showPromoForm ? 'hide' : ''}`}
              onClick={() => setShowPromoForm(!showPromoForm)}
            >
              <Plus size={20} />
              Create New Promo Code
            </button>

            {showPromoForm && (
              <form className="promo-form" onSubmit={handleAddPromo}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="code">Promo Code *</label>
                    <input
                      type="text"
                      id="code"
                      value={newPromo.code}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })
                      }
                      placeholder="E.g., SUMMER20"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="discount">Discount Value *</label>
                    <input
                      type="number"
                      id="discount"
                      value={newPromo.discount}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, discount: e.target.value })
                      }
                      placeholder="Enter amount or percentage"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="type">Discount Type *</label>
                    <select
                      id="type"
                      value={newPromo.type}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, type: e.target.value })
                      }
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (KES)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="maxUses">Max Uses (Optional)</label>
                    <input
                      type="number"
                      id="maxUses"
                      value={newPromo.maxUses}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, maxUses: e.target.value })
                      }
                      placeholder="Leave empty for unlimited"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="expiryDate">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      id="expiryDate"
                      value={newPromo.expiryDate}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, expiryDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowPromoForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    Create Promo Code
                  </button>
                </div>
              </form>
            )}

            {promoCodes.length > 0 && (
              <div className="promos-list">
                <h3>Active Promo Codes ({promoCodes.length})</h3>
                <div className="promos-table">
                  {promoCodes.map((promo) => (
                    <div key={promo.id} className="promo-row">
                      <div className="promo-info">
                        <div className="promo-code">
                          {promo.active ? (
                            <span className="badge-active">ACTIVE</span>
                          ) : (
                            <span className="badge-inactive">INACTIVE</span>
                          )}
                          <strong>{promo.code}</strong>
                        </div>
                        <div className="promo-details">
                          <span>
                            {promo.discount}
                            {promo.type === 'percentage' ? '%' : ' KES'} off
                          </span>
                          {promo.maxUses && (
                            <span>• Max {promo.maxUses} uses</span>
                          )}
                          {promo.expiryDate && (
                            <span>• Expires: {promo.expiryDate}</span>
                          )}
                          <span>• Created: {promo.createdAt}</span>
                        </div>
                      </div>

                      <div className="promo-actions">
                        <button
                          className={`toggle-btn ${!promo.active ? 'inactive' : ''}`}
                          onClick={() => togglePromoActive(promo.id)}
                          title={promo.active ? 'Deactivate' : 'Activate'}
                        >
                          {promo.active ? (
                            <Eye size={18} />
                          ) : (
                            <EyeOff size={18} />
                          )}
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeletePromo(promo.id)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {promoCodes.length === 0 && !showPromoForm && (
              <div className="empty-state">
                <Gift size={48} />
                <p>No promo codes created yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Save Button */}
        <div className="settings-footer">
          <button className="save-settings-btn" onClick={saveSettings} disabled={!settingsLoaded}>
            <Save size={20} />
            Save All Settings
          </button>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminSettings;
