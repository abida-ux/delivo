import { useState } from 'react';
import './AdminNotificationSender.css';
import { sendAdminNotification } from '../services/api';

const AdminNotificationSender = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [targetRole, setTargetRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResponse(null);

    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        targetType,
      };

      if (targetType === 'role') {
        payload.targetRole = targetRole;
      }

      const result = await sendAdminNotification(payload);

      if (result.success) {
        setResponse(result);
        setTitle('');
        setMessage('');
        console.log('✅ Admin notification sent:', result.stats);
      } else {
        setError(result.message || 'Failed to send notification');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error sending notification';
      setError(errorMsg);
      console.error('❌ Error sending admin notification:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-notification-sender">
      <div className="sender-container">
        <h2>Send Push Notification</h2>
        <p className="sender-description">
          Send a notification to all users or target specific groups
        </p>

        {error && (
          <div className="sender-error">
            <span>❌ {error}</span>
          </div>
        )}

        {response && (
          <div className="sender-success">
            <div className="success-header">✅ Notification Sent Successfully!</div>
            <div className="success-stats">
              <div className="stat-item">
                <span className="stat-label">Targeted Users:</span>
                <span className="stat-value">{response.stats.targetedUsers}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Push Notifications Sent:</span>
                <span className="stat-value">{response.stats.pushSent}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">In-App Notifications:</span>
                <span className="stat-value">{response.stats.inAppCreated}</span>
              </div>
              {response.stats.pushFailed > 0 && (
                <div className="stat-item warning">
                  <span className="stat-label">Failed:</span>
                  <span className="stat-value">{response.stats.pushFailed}</span>
                </div>
              )}
            </div>
            {response.errors && response.errors.length > 0 && (
              <div className="success-errors">
                <p className="errors-title">Errors:</p>
                <ul>
                  {response.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="sender-form">
          <div className="form-group">
            <label htmlFor="title">Notification Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              maxLength={100}
              disabled={loading}
            />
            <span className="char-count">{title.length}/100</span>
          </div>

          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              maxLength={500}
              rows={4}
              disabled={loading}
            />
            <span className="char-count">{message.length}/500</span>
          </div>

          <div className="form-group">
            <label htmlFor="targetType">Send To</label>
            <select
              id="targetType"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              disabled={loading}
            >
              <option value="all">All Users</option>
              <option value="role">By Role</option>
            </select>
          </div>

          {targetType === 'role' && (
            <div className="form-group">
              <label htmlFor="targetRole">Target Role</label>
              <select
                id="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                disabled={loading}
              >
                <option value="customer">Customers</option>
                <option value="rider">Riders</option>
                <option value="restaurant">Restaurants</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="send-btn"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminNotificationSender;
