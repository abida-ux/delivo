import { useEffect, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import './NotificationModal.css';

const NotificationModal = ({ 
  isOpen, 
  onClose, 
  notifications = [], 
  onDelete,
  onClickItem
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
    <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
      <div className="notification-modal-header">
        <h3>Notifications</h3>
        <button className="notification-close-btn" onClick={onClose} title="Close notifications">
          <X size={16} />
        </button>
      </div>

      <div className="notification-modal-body">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif._id} 
              className="notification-item"
              onClick={() => onClickItem && onClickItem(notif)}
              style={{ cursor: onClickItem ? 'pointer' : 'default' }}
            >
              <div className="notification-icon">
                <Bell size={18} />
              </div>
              <div className="notification-content">
                <p className="notification-title">{notif.title}</p>
                <p className="notification-message">{notif.message}</p>
                <span className="notification-time">
                  {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button 
                className="notification-delete-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(notif._id);
                }}
                title="Delete notification"
              >
                <X size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="notification-empty">
            <Bell size={40} />
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationModal;
