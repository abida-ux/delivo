import {useState, useContext} from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import './AdminNotifications.css';

const AdminNotifications = () => {
  const { token, user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'system',
    userId: '', // Empty means broadcast to all
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="admin-notifications-container">
        <div className="admin-access-denied">
          <AlertCircle size={48} />
          <h2>Access Denied</h2>
          <p>Only administrators can send notifications.</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      setErrorMessage('Title and message are required');
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await api.post('/notifications/create', {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        userId: formData.userId || null,
      });

      setSuccessMessage(
        formData.userId
          ? `✅ Notification sent to user!`
          : `✅ Notification broadcast to all users!`
      );

      setFormData({
        title: '',
        message: '',
        type: 'system',
        userId: '',
      });

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error sending notification:', error);
      setErrorMessage('Error sending notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-notifications-container">
      <div className="admin-notifications-card">
        <h2>Send Notification</h2>
        <p className="admin-notifications-subtitle">
          Send important updates to users in real-time
        </p>

        {successMessage && (
          <div className="admin-notification-success">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="admin-notification-error">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-notifications-form">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Order Confirmed"
              maxLength={50}
              disabled={loading}
            />
            <small>{formData.title.length}/50</small>
          </div>

          {/* Message */}
          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Enter your notification message here..."
              rows={5}
              maxLength={500}
              disabled={loading}
            />
            <small>{formData.message.length}/500</small>
          </div>

          {/* Type */}
          <div className="form-group">
            <label htmlFor="type">Notification Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="system">System</option>
              <option value="order">Order Update</option>
              <option value="promotion">Promotion</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>

          {/* User ID (Optional) */}
          <div className="form-group">
            <label htmlFor="userId">Send to Specific User (Optional)</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleInputChange}
              placeholder="Leave empty to broadcast to all users"
              disabled={loading}
            />
            <small>
              {formData.userId
                ? '📤 Will send to this specific user'
                : '📢 Will broadcast to all users'}
            </small>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="admin-notifications-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Notification
              </>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="admin-notifications-info">
          <p>
            💡 <strong>Tip:</strong> Leave the "Send to Specific User" field empty
            to broadcast your notification to all users. Otherwise, enter a user ID
            to send to a specific user.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
