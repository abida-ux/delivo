import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingCart,
  TrendingUp,
  LogOut,
  Menu,
  X,
  UtensilsCrossed,
  Settings,
  Truck,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './AdminSidebar.css';

const AdminSidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);

  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Restaurants', path: '/admin/restaurants', icon: Store },
    { label: 'Foods', path: '/admin/foods', icon: UtensilsCrossed },
    { label: 'Riders', path: '/admin/riders', icon: Truck },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Analytics', path: '/admin/analytics', icon: TrendingUp },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-icon">D</div>
            <span className="logo-text">Delivo Admin</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setIsOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <p className="user-name">{user?.name}</p>
            <p className="user-role">Administrator</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={() => setIsOpen(false)}
      />
    </>
  );
};

export default AdminSidebar;
