import { useEffect, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import './NotificationModal.css';

const NotificationModal = ({ 
  isOpen, 
  onClose, 
  notifications, 
  onDelete 
}) => {

  // Close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="notifications-modal-overlay" onClick={onClose}>
      <div className="notifications-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-modal-header">
          <h2>Notifications</h2>
          <button className="notifications-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="notifications-modal-items">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div key={notif._id} className="notification-item">
                <div className="notification-content">
                  <p className="notification-title">{notif.title}</p>
                  <p className="notification-message">{notif.message}</p>
                  <span className="notification-time">
                    {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button 
                  className="notification-close-btn" 
                  onClick={() => onDelete(notif._id)}
                >
                  <X size={18} />
                </button>
              </div>
            ))
          ) : (
            <div className="notifications-empty-state">
              <Bell size={48} />
              <h3>No notifications</h3>
              <p>You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
