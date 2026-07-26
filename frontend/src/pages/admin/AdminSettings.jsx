import {useState, useEffect, useContext} from 'react';
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
    notificationMessage: 'Free delivery for orders above Ksh 2,500!',
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [promoCodes, setPromoCodes] = useState([]);
  const [newPromo, setNewPromo] = useState({
    code: '',
    title: '',
    description: '',
    discount: '',
    minOrder: 'KSh 0',
    expiry: '',
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
          notificationMessage: appSettings.notificationMessage || 'Free delivery for orders above Ksh 2,500!',
        });

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

    fetchPromoCodes();
    
    // Fetch notifications from backend
    if (user && token) {
      fetchNotifications();
    }
  }, [user, token]);

  const fetchPromoCodes = async () => {
    try {
      const { data } = await api.get('/offers');
      setPromoCodes(data.data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

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

      setNotificationMessage('Notification sent successfully!');
      setNotificationForm({ title: '', message: '', type: 'system', userId: '' });
      setTimeout(() => setNotificationMessage(''), 3000);
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      setNotificationMessage('Error sending notification');

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

  // Save settings to backend
  const saveSettings = async () => {
    try {
      await updateAppSettings(settings);

      try {
        localStorage.setItem('app_settings_updated', Date.now().toString());
        window.dispatchEvent(new Event('app_settings_updated'));
      } catch (e) {
        // ignore storage errors
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

  const handleAddPromo = async (e) => {
    e.preventDefault();

    if (!newPromo.code || !newPromo.title || !newPromo.description || !newPromo.discount || !newPromo.expiry) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        code: newPromo.code.toUpperCase(),
        title: newPromo.title,
        description: newPromo.description,
        discount: newPromo.discount,
        minOrder: newPromo.minOrder || 'KSh 0',
        expiry: newPromo.expiry,
      };

      await api.post('/offers', payload);
      
      // Reset form
      setNewPromo({
        code: '',
        title: '',
        description: '',
        discount: '',
        minOrder: 'KSh 0',
        expiry: '',
      });
      setShowPromoForm(false);
      alert('Offer created successfully!');
      fetchPromoCodes();
    } catch (error) {
      console.error('Failed to create offer:', error);
      alert(error.response?.data?.message || 'Failed to create promo code');
    }
  };

  const handleDeletePromo = async (id) => {
    if (window.confirm('Are you sure you want to delete this promo code?')) {
      try {
        await api.delete(`/offers/${id}`);
        alert('Promo code deleted!');
        fetchPromoCodes();
      } catch (error) {
        console.error('Failed to delete offer:', error);
        alert('Failed to delete promo code');
      }
    }
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
                  <p className="preview-title">Preview:</p>

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
                <label htmlFor="delivery-fee-amount">Delivery Fee Amount (Ksh)</label>
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
                  Current delivery fee applied at checkout: Ksh {settings.deliveryFeeAmount}
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
                    <label htmlFor="title">Offer Title *</label>
                    <input
                      type="text"
                      id="title"
                      value={newPromo.title}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, title: e.target.value })
                      }
                      placeholder="E.g., Free Food Voucher or KES 500 Off"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="discount">Discount Label *</label>
                    <input
                      type="text"
                      id="discount"
                      value={newPromo.discount}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, discount: e.target.value })
                      }
                      placeholder="E.g., FREE SODA, 50% OFF, FREE FOOD"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="minOrder">Minimum Order Amount (Optional)</label>
                    <input
                      type="text"
                      id="minOrder"
                      value={newPromo.minOrder}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, minOrder: e.target.value })
                      }
                      placeholder="E.g., KSh 500 or KSh 0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="expiry">Expiry Details *</label>
                    <input
                      type="text"
                      id="expiry"
                      value={newPromo.expiry}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, expiry: e.target.value })
                      }
                      placeholder="E.g., Expires tonight, Valid till Sunday"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description *</label>
                    <input
                      type="text"
                      id="description"
                      value={newPromo.description}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, description: e.target.value })
                      }
                      placeholder="E.g., Get a free soda with orders above KES 1,000"
                      required
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
                    Create Offer
                  </button>
                </div>
              </form>
            )}

            {promoCodes.length > 0 && (
              <div className="promos-list">
                <h3>Active Promo Codes ({promoCodes.length})</h3>
                <div className="promos-table">
                  {promoCodes.map((promo) => (
                    <div key={promo._id || promo.id} className="promo-row">
                      <div className="promo-info">
                        <div className="promo-code">
                          <span className="badge-active">ACTIVE</span>
                          <strong>{promo.code}</strong> - <span style={{ color: '#555555', fontWeight: 600 }}>{promo.title}</span>
                        </div>
                        <div className="promo-details">
                          <span>Label: {promo.discount}</span>
                          <span>• {promo.expiry}</span>
                          <span>• Min Order: {promo.minOrder}</span>
                          <span>• {promo.description}</span>
                        </div>
                      </div>

                      <div className="promo-actions">
                        <button
                          className="delete-btn"
                          onClick={() => handleDeletePromo(promo._id || promo.id)}
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
