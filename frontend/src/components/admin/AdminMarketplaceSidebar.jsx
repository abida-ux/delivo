import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Store,
  Flame,
  Image,
  ShoppingCart,
  Ticket,
  MessageSquare,
  Tag,
  ArrowLeft,
  Users,
  BarChart2,
  Settings,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import AdminSwitchModal from './AdminSwitchModal';
import './AdminMarketplaceSidebar.css';

export default function AdminMarketplaceSidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const mainGroup = [
    { label: 'Dashboard', path: '/admin/marketplace', icon: LayoutDashboard },
    { label: 'Reports', path: '/admin/marketplace/reports', icon: BarChart2 },
  ];

  const managementGroup = [
    { label: 'Products', path: '/admin/marketplace/products', icon: Package },
    { label: 'Categories', path: '/admin/marketplace/categories', icon: Layers },
    { label: 'Stores', path: '/admin/marketplace/stores', icon: Store },
    { label: 'Flash Sales', path: '/admin/marketplace/flash-sales', icon: Flame },
    { label: 'Banners', path: '/admin/marketplace/banners', icon: Image },
    { label: 'Orders', path: '/admin/marketplace/orders', icon: ShoppingCart },
    { label: 'Customers', path: '/admin/marketplace/customers', icon: Users },
    { label: 'Coupons', path: '/admin/marketplace/coupons', icon: Ticket },
    { label: 'Reviews', path: '/admin/marketplace/reviews', icon: MessageSquare },
    { label: 'Second-Hand', path: '/admin/marketplace/second-hand', icon: Tag },
  ];

  const systemGroup = [
    { label: 'Settings', path: '/admin/marketplace/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <aside className={`mkt-admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="mkt-admin-sidebar-header">
          <div className="mkt-admin-brand-group">
            <div className="mkt-admin-brand-icon">
              <img src="/delivo.jpg" alt="Delivo" />
            </div>
            <div>
              <span className="mkt-admin-brand-title">Delivo Admin</span>
              <span className="mkt-admin-brand-tag">Marketplace</span>
            </div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <p className="user-name">{user?.name}</p>
            <p className="user-role">Administrator</p>
          </div>
        </div>

        <nav className="mkt-admin-nav">
          <div className="mkt-nav-group-label">MAIN</div>
          {mainGroup.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.label}
                className={`mkt-admin-nav-item ${active ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  if (setIsOpen) setIsOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="mkt-nav-group-label">MARKETPLACE</div>
          {managementGroup.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.label}
                className={`mkt-admin-nav-item ${active ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  if (setIsOpen) setIsOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="mkt-nav-group-label">SYSTEM</div>
          {systemGroup.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.label}
                className={`mkt-admin-nav-item ${active ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  if (setIsOpen) setIsOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mkt-admin-sidebar-footer">
          <button className="mkt-return-food-btn" onClick={() => setShowSwitchModal(true)}>
            <ArrowLeft size={16} />
            <span>Return to Food Admin</span>
          </button>
        </div>
      </aside>

      <AdminSwitchModal
        isOpen={showSwitchModal}
        targetMode="food"
        onClose={() => setShowSwitchModal(false)}
        onConfirm={() => {
          setShowSwitchModal(false);
          navigate('/admin');
        }}
      />
    </>
  );
}
