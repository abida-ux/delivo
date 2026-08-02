import { useContext } from 'react';
import { User, Search, Bell, Plus, ChevronRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './AdminNavbar.css';

const AdminNavbar = ({ pageTitle }) => {
  const { user } = useContext(AuthContext);

  return (
    <div className="admin-header-nav">
      {/* Left: Breadcrumbs & Title */}
      <div className="header-left">
        <div className="breadcrumbs">
          <span>Delivo</span>
          <ChevronRight size={12} className="breadcrumb-separator" />
          <span className="breadcrumb-active">{pageTitle || 'Dashboard'}</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="header-search-wrapper">
        <Search size={16} className="search-bar-icon" />
        <input 
          type="text" 
          placeholder="Search everything..." 
          className="header-search-input"
          aria-label="Global Search"
        />
      </div>

      {/* Right: Actions & Profile */}
      <div className="header-right">
        {/* Quick Action Create Button */}
        <button className="create-action-btn" aria-label="Create New Item">
          <Plus size={16} />
          <span>Create</span>
        </button>

        {/* Notifications Trigger */}
        <button className="header-icon-trigger" aria-label="View Notifications">
          <Bell size={18} />
          <span className="notification-dot-active" />
        </button>

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
  );
};

export default AdminNavbar;
