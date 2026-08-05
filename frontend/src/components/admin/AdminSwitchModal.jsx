import React from 'react';
import { ShoppingBag, UtensilsCrossed } from 'lucide-react';
import './AdminSwitchModal.css';

export default function AdminSwitchModal({ isOpen, onClose, onConfirm, targetMode }) {
  if (!isOpen) return null;

  const isSwitchingToMarketplace = targetMode === 'marketplace';

  return (
    <div className="admin-switch-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-switch-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="admin-switch-icon-wrap">
          {isSwitchingToMarketplace ? <ShoppingBag size={26} /> : <UtensilsCrossed size={26} />}
        </div>

        <h3>
          {isSwitchingToMarketplace ? 'Switch to Marketplace Administration' : 'Return to Food Delivery Administration'}
        </h3>
        <p>
          {isSwitchingToMarketplace
            ? 'You are about to leave the Food Delivery Administration dashboard and enter the Marketplace Administration dashboard. You can switch back at any time.'
            : 'You are about to leave Marketplace Administration and return to the Food Delivery Administration dashboard.'}
        </p>

        <div className="admin-switch-actions">
          <button type="button" className="admin-switch-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="admin-switch-btn-confirm" onClick={onConfirm}>
            {isSwitchingToMarketplace ? 'Enter Marketplace Admin' : 'Return to Food Admin'}
          </button>
        </div>
      </div>
    </div>
  );
}
