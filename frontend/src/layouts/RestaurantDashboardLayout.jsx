import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  CheckCircle2,
  UtensilsCrossed,
  BarChart3,
  Wallet,
  CreditCard,
  User,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getNotifications } from '../services/api';
import { X } from 'lucide-react';
import './RestaurantDashboardLayout.css';

const menuItems = [
  { label: 'Dashboard', path: '/restaurant', icon: LayoutDashboard },
  { label: 'Orders', path: '/restaurant/orders', icon: ShoppingCart },
  { label: 'Completed', path: '/restaurant/completed-orders', icon: CheckCircle2 },
  { label: 'Revenue', path: '/restaurant/revenue', icon: BarChart3 },
  { label: 'Withdrawals', path: '/restaurant/withdrawals', icon: Wallet },
  { label: 'Transactions', path: '/restaurant/transactions', icon: CreditCard },
  { label: 'Profile', path: '/restaurant/profile', icon: User },
  { label: 'Settings', path: '/restaurant/settings', icon: Settings },
];

const RestaurantSidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);

  const isActive = (path) => {
    if (path === '/restaurant' && location.pathname === '/restaurant-dashboard') return true;
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className={`restaurant-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="restaurant-sidebar-header">
        <div>
          <img className="restaurant-logo" src="/delivo.jpg" alt="Delivo" />
          <div>
            <h2>Restaurant Portal</h2>
            <p>{user?.name || 'Partner Owner'}</p>
          </div>
        </div>
        <button className="sidebar-close" onClick={() => setIsOpen(false)}>
          <Menu size={20} />
        </button>
      </div>

      <nav className="restaurant-sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              className={`restaurant-sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="restaurant-sidebar-footer">
        <button className="restaurant-sidebar-item logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const RestaurantBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const bottomItems = [
    { label: 'Dashboard', path: '/restaurant', icon: LayoutDashboard },
    { label: 'Orders', path: '/restaurant/orders', icon: ShoppingCart },
    { label: 'Profile', path: '/restaurant/profile', icon: User },
  ];

  const isActive = (path) => {
    if (path === '/restaurant' && location.pathname === '/restaurant-dashboard') return true;
    return location.pathname === path;
  };

  return (
    <nav className="restaurant-bottom-nav">
      {bottomItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            className={`restaurant-bottom-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            title={item.label}
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

const RestaurantDashboardLayout = ({ children, pageTitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const seenNotificationIds = useRef(new Set());
  const isFirstFetch = useRef(true);

  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const data = await getNotifications();
        if (data?.success && data?.notifications) {
          const newNotifications = data.notifications;

          if (isFirstFetch.current) {
            newNotifications.forEach((n) => seenNotificationIds.current.add(n._id));
            isFirstFetch.current = false;
            return;
          }

          const notificationsToToast = [...newNotifications]
            .reverse()
            .filter((n) => !seenNotificationIds.current.has(n._id));

          notificationsToToast.forEach((n) => {
            seenNotificationIds.current.add(n._id);
            const toastId = n._id;
            setToasts((prev) => [
              ...prev,
              { id: toastId, title: n.title, message: n.message, isFading: false },
            ]);

            setTimeout(() => {
              setToasts((prev) => prev.map((t) => (t.id === toastId ? { ...t, isFading: true } : t)));
            }, 5700);

            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== toastId));
            }, 6000);
          });
        }
      } catch (err) {
        console.error('Error polling restaurant notifications:', err);
      }
    };

    pollNotifications();
    const interval = setInterval(pollNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="restaurant-layout">
      <RestaurantSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="restaurant-main">
        <div className="restaurant-topbar">
          <button className="restaurant-topbar-menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="restaurant-topbar-title">
            <h1>{pageTitle || 'Restaurant Portal'}</h1>
          </div>
        </div>

        <div className="restaurant-content">
          {children}
        </div>
      </div>
      <RestaurantBottomNav />
      {/* Toast container for restaurant owner notifications */}
      <div className="admin-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`admin-toast ${toast.isFading ? 'fade-out' : ''}`}>
            <div className="admin-toast-icon">
              <ShoppingCart size={18} />
            </div>
            <div className="admin-toast-content">
              <h4 className="admin-toast-title">{toast.title}</h4>
              <p className="admin-toast-message">{toast.message}</p>
            </div>
            <button className="admin-toast-close" onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantDashboardLayout;
