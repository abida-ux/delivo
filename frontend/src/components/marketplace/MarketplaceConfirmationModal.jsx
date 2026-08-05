import { useEffect, useRef } from 'react';
import { ShoppingBag, ArrowRight, X, ShieldCheck } from 'lucide-react';
import './MarketplaceConfirmationModal.css';

export default function MarketplaceConfirmationModal({ isOpen, onClose, onConfirm }) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      confirmBtnRef.current?.focus();

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="mkt-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mkt-modal-title"
    >
      <div
        className="mkt-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="mkt-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="mkt-modal-header">
          <div className="mkt-modal-icon-badge">
            <ShoppingBag size={24} />
          </div>
          <h2 id="mkt-modal-title" className="mkt-modal-title">
            Enter Delivo Marketplace
          </h2>
        </div>

        <div className="mkt-modal-body">
          <p className="mkt-modal-description">
            You are about to leave the Food Delivery experience and enter <strong>Delivo Marketplace</strong>.
          </p>
          <p className="mkt-modal-subtext">
            Marketplace allows you to browse products from multiple shops, discover flash sales, purchase household essentials, electronics, fashion, groceries, pharmacy products, and much more.
          </p>

          <div className="mkt-modal-feature-note">
            <ShieldCheck size={16} />
            <span>Your Food Delivery experience will remain available and you can switch back at any time.</span>
          </div>
        </div>

        <div className="mkt-modal-actions">
          <button
            type="button"
            className="mkt-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className="mkt-btn-confirm"
            onClick={onConfirm}
          >
            <span>Enter Marketplace</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
