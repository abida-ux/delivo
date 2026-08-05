import { useState } from 'react';
import AdminMarketplaceLayout from '../../../layouts/AdminMarketplaceLayout';
import { Settings, Save } from 'lucide-react';
import '../AdminMarketplace.css';

export default function AdminMarketplaceSettings() {
  const [settings, setSettings] = useState({
    marketplaceName: 'Delivo Marketplace',
    defaultCurrency: 'KES',
    defaultDeliveryFee: 150,
    enableSecondHandMarketplace: true,
    requireSecondHandApproval: true,
    flashSaleBannerText: '🔥 FLASH SALE IS LIVE! Limited Stock Deals!',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AdminMarketplaceLayout pageTitle="Marketplace Configuration & Settings">
      <div className="admin-mkt-container" style={{ padding: 0 }}>
        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">General Marketplace Settings</h3>
          <form onSubmit={handleSave} className="admin-mkt-grid-form">
            <div className="admin-mkt-field">
              <label>Marketplace Store Name</label>
              <input type="text" value={settings.marketplaceName} onChange={(e) => setSettings({ ...settings, marketplaceName: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Default Currency</label>
              <input type="text" value={settings.defaultCurrency} onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Default Standard Shipping Fee (KES)</label>
              <input type="number" value={settings.defaultDeliveryFee} onChange={(e) => setSettings({ ...settings, defaultDeliveryFee: Number(e.target.value) })} />
            </div>
            <div className="admin-mkt-field" style={{ gridColumn: '1 / -1' }}>
              <label>Flash Sale Announcement Banner</label>
              <input type="text" value={settings.flashSaleBannerText} onChange={(e) => setSettings({ ...settings, flashSaleBannerText: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label><input type="checkbox" checked={settings.enableSecondHandMarketplace} onChange={(e) => setSettings({ ...settings, enableSecondHandMarketplace: e.target.checked })} /> Enable Second-Hand / Pre-Owned Marketplace</label>
              <label><input type="checkbox" checked={settings.requireSecondHandApproval} onChange={(e) => setSettings({ ...settings, requireSecondHandApproval: e.target.checked })} /> Require Admin Approval for Second-Hand Listings</label>
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
              <button type="submit" className="admin-mkt-btn-primary">
                {saved ? 'Settings Saved! ✓' : 'Save Marketplace Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminMarketplaceLayout>
  );
}
