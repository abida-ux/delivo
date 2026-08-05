import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import './ReturnToFoodModal.css';

export default function ReturnToFoodModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="return-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="return-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="return-modal-icon-wrap">
          <UtensilsCrossed size={26} />
        </div>

        <h3>Return to Food Delivery</h3>
        <p>
          You are about to leave Delivo Marketplace and return to the Food Delivery experience.
        </p>
        <p className="return-subtext">
          You can switch back to Marketplace at any time.
        </p>

        <div className="return-modal-actions">
          <button type="button" className="return-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="return-btn-confirm" onClick={onConfirm}>
            Return to Food Delivery
          </button>
        </div>
      </div>
    </div>
  );
}
