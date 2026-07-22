import { useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

const LogoutModal = ({ isOpen, onConfirm, onCancel }) => {

  // Close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onCancel();
  }, [onCancel]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="logout-confirm-overlay" onClick={onCancel}>
      <div className="logout-confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="logout-confirm-icon">
          <AlertCircle size={48} />
        </div>
        <h3>Confirm Logout</h3>
        <p>Are you sure you want to log out?</p>
        <div className="logout-confirm-actions">
          <button className="logout-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="logout-btn-confirm" onClick={onConfirm}>
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
