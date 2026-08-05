import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Search, Bell, Plus, ChevronRight, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import AdminSwitchModal from './admin/AdminSwitchModal';
import './AdminNavbar.css';

const AdminNavbar = ({ pageTitle }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  return (
    <>
      <div className="admin-header-nav">
        {/* Left: Breadcrumbs & Title */}
        <div className="header-left">
          <div className="breadcrumbs">
            <span>Delivo</span>
            <ChevronRight size={12} className="breadcrumb-separator" />
            <span className="breadcrumb-active">{pageTitle || 'Dashboard'}</span>
          </div>
        </div>

        {/* Center: EXPERIENCE SWITCHER PILL */}
        <div className="admin-experience-switcher">
          <button
            type="button"
            className="exp-switcher-btn active"
            title="Food Delivery Administration Active"
          >
            <UtensilsCrossed size={14} />
            <span>Food Admin</span>
          </button>
          <button
            type="button"
            className="exp-switcher-btn"
            onClick={() => setShowSwitchModal(true)}
            title="Switch to Marketplace Administration"
          >
            <ShoppingBag size={14} />
            <span>Marketplace Admin</span>
          </button>
        </div>

        {/* Right: Actions & Profile */}
        <div className="header-right">
          {/* User Profile Avatar */}
          <div className="header-user-profile">
            <div className="profile-avatar-wrapper">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-details-text">
              <span className="profile-username">{user?.name}</span>
              <span className="profile-user-role">Administrator</span>
            </div>
          </div>
        </div>
      </div>

      <AdminSwitchModal
        isOpen={showSwitchModal}
        targetMode="marketplace"
        onClose={() => setShowSwitchModal(false)}
        onConfirm={() => {
          setShowSwitchModal(false);
          navigate('/admin/marketplace');
        }}
      />
    </>
  );
};

export default AdminNavbar;
