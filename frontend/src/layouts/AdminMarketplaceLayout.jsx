import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ShoppingBag, X, Bell, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import AdminMarketplaceSidebar from '../components/admin/AdminMarketplaceSidebar';
import AdminSwitchModal from '../components/admin/AdminSwitchModal';
import './AdminMarketplaceLayout.css';

export default function AdminMarketplaceLayout({ children, pageTitle = 'Marketplace Administration' }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  return (
    <div className="mkt-admin-layout">
      <AdminMarketplaceSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="mkt-admin-main">
        {/* Navbar with Experience Switcher */}
        <header className="mkt-admin-navbar">
          <div className="mkt-navbar-title-group">
            <h2 className="mkt-navbar-title">{pageTitle}</h2>
          </div>

          {/* EXPERIENCE SWITCHER PILL */}
          <div className="admin-experience-switcher">
            <button
              type="button"
              className="exp-switcher-btn"
              onClick={() => setShowSwitchModal(true)}
              title="Switch to Food Delivery Administration"
            >
              <UtensilsCrossed size={14} />
              <span>Food Delivery</span>
            </button>
            <button
              type="button"
              className="exp-switcher-btn active"
              title="Marketplace Administration Active"
            >
              <ShoppingBag size={14} />
              <span>Marketplace Admin</span>
            </button>
          </div>

          {/* RIGHT USER INFO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{user?.name || 'Admin'}</div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="admin-content-area" style={{ padding: 24 }}>
          {children}
        </main>
      </div>

      {/* Switch Confirmation Modal */}
      <AdminSwitchModal
        isOpen={showSwitchModal}
        targetMode="food"
        onClose={() => setShowSwitchModal(false)}
        onConfirm={() => {
          setShowSwitchModal(false);
          navigate('/admin');
        }}
      />
    </div>
  );
}
