import { useState, useContext, useEffect } from 'react';
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
  Bell,
  Layers,
  ListFilter,
  DollarSign,
  ShoppingBasket,
  Flame,
  Terminal,
  Wallet,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getAllOrders } from '../services/api';
import AdminSwitchModal from './admin/AdminSwitchModal';
import './AdminSidebar.css';

const AdminSidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    const fetchNewOrdersCount = async () => {
      try {
        const orders = await getAllOrders();
        const viewedStr = localStorage.getItem('delivo_admin_viewed_orders');
        const viewedIds = viewedStr ? JSON.parse(viewedStr) : [];
        // Count orders that are 'placed', 'pending' or 'confirmed' and have not been viewed
        const count = orders.filter(
          (o) => (o.status === 'placed' || o.status === 'pending' || o.status === 'confirmed') && !viewedIds.includes(o._id)
        ).length;
        setNewOrdersCount(count);
      } catch (err) {
        console.warn('Error fetching admin new orders count:', err);
      }
    };

    fetchNewOrdersCount();
    const interval = setInterval(fetchNewOrdersCount, 10000);
    window.addEventListener('storage', fetchNewOrdersCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchNewOrdersCount);
    };
  }, []);

  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Restaurants', path: '/admin/restaurants', icon: Store },
    { label: 'Foods Template', path: '/admin/foods', icon: UtensilsCrossed },
    { label: 'Flash Sales', path: '/admin/flash-sales', icon: Flame },
    { label: 'Marketplace', path: '/admin/marketplace', icon: ShoppingBasket },
    { label: 'Categories', path: '/admin/categories', icon: ListFilter },
    { label: 'Combinations', path: '/admin/combinations', icon: Layers },
    { label: 'Restaurant Pricing', path: '/admin/restaurant-foods', icon: DollarSign },
    { label: 'Riders', path: '/admin/riders', icon: Truck },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
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
            <div className="logo-icon">
              <img src="/delivo.jpg" alt="Delivo" />
            </div>
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
          {/* ── MAIN GROUP ── */}
          <div className="nav-group">
            <span className="nav-group-label">MAIN</span>
            <button
              className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
              onClick={() => { navigate('/admin'); setIsOpen(false); }}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </button>
            <button
              className={`nav-item ${isActive('/admin/analytics') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/analytics'); setIsOpen(false); }}
            >
              <TrendingUp size={20} />
              <span>Analytics</span>
            </button>
          </div>

          {/* ── MANAGEMENT GROUP ── */}
          <div className="nav-group">
            <span className="nav-group-label">MANAGEMENT</span>
            <button
              className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/users'); setIsOpen(false); }}
            >
              <Users size={20} />
              <span>Users</span>
            </button>
            <button
              className={`nav-item ${isActive('/admin/restaurants') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/restaurants'); setIsOpen(false); }}
            >
              <Store size={20} />
              <span>Restaurants</span>
            </button>
            <button
              className={`nav-item ${isActive('/admin/marketplace') ? 'active' : ''}`}
              onClick={() => {
                setShowSwitchModal(true);
                if (setIsOpen) setIsOpen(false);
              }}
            >
              <ShoppingBasket size={20} />
              <span>Marketplace Admin</span>
            </button>
            <button
              className={`nav-item ${isActive('/admin/orders') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/orders'); setIsOpen(false); }}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}
            >
              <ShoppingCart size={20} />
              <span>Orders</span>
              {newOrdersCount > 0 && (
                <span className="sidebar-badge" style={{
                  marginLeft: 'auto',
                  background: 'var(--color-orange)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  lineHeight: '1.2'
                }}>
                  {newOrdersCount}
                </span>
              )}
            </button>
            <button
              className={`nav-item ${isActive('/admin/categories') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/categories'); setIsOpen(false); }}
            >
              <ListFilter size={20} />
              <span>Categories</span>
            </button>
            <button
              className={`nav-item ${isActive('/admin/foods') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/foods'); setIsOpen(false); }}
            >
              <UtensilsCrossed size={20} />
              <span>Foods</span>
            </button>
            <button
              className={`nav-item ${isActive('/admin/flash-sales') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/flash-sales'); setIsOpen(false); }}
            >
              <Flame size={20} />
              <span>Flash Sales</span>
            </button>
            <button
              className={`nav-item ${isActive('/admin/restaurant-foods') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/restaurant-foods'); setIsOpen(false); }}
            >
              <DollarSign size={20} />
              <span>Pricing</span>
            </button>
            <button
              className={`nav-item ${isActive('/admin/combinations') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/combinations'); setIsOpen(false); }}
            >
              <Layers size={20} />
              <span>Combinations</span>
            </button>
          </div>

          {/* ── OPERATIONS GROUP ── */}
          <div className="nav-group">
            <span className="nav-group-label">OPERATIONS</span>
            <button
              className={`nav-item ${isActive('/admin/riders') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/riders'); setIsOpen(false); }}
            >
              <Truck size={20} />
              <span>Riders</span>
            </button>
            <button
              className={`nav-item ${isActive('/admin/payouts') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/payouts'); setIsOpen(false); }}
            >
              <Wallet size={20} />
              <span>Rider Payouts</span>
            </button>
            <button
              className={`nav-item ${isActive('/admin/notifications') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/notifications'); setIsOpen(false); }}
            >
              <Bell size={20} />
              <span>Notifications</span>
            </button>
          </div>

          {/* ── SYSTEM GROUP ── */}
          <div className="nav-group">
            <span className="nav-group-label">SYSTEM</span>
            <button
              className={`nav-item ${isActive('/admin/settings') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/settings'); setIsOpen(false); }}
            >
              <Settings size={20} />
              <span>Settings</span>
            </button>
            <button
              className={`nav-item ${isActive('/admin/logs') ? 'active' : ''}`}
              onClick={() => { navigate('/admin/logs'); setIsOpen(false); }}
            >
              <Terminal size={20} />
              <span>Audit Logs</span>
            </button>
          </div>
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

export default AdminSidebar;
