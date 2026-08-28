import { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  UtensilsCrossed,
  ShoppingCart,
  TrendingUp,
  Settings,
  ShoppingBasket,
  LogOut,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getAllOrders } from '../services/api';
import './AdminBottomNav.css';
import { safeGetParsedItem } from '../utils/storageUtils';

const AdminBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    const fetchNewOrdersCount = async () => {
      try {
        const orders = await getAllOrders();
        const viewedIds = safeGetParsedItem('delivo_admin_viewed_orders', []) || [];
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
    { label: 'Foods', path: '/admin/foods', icon: UtensilsCrossed },
    { label: 'Marketplace', path: '/admin/marketplace', icon: ShoppingBasket },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Analytics', path: '/admin/analytics', icon: TrendingUp },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
    { label: 'Logout', path: 'logout', icon: LogOut },
  ];

  const isActive = (path) => location.pathname === path;

  const handleItemClick = (path) => {
    if (path === 'logout') {
      logout();
      navigate('/');
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="admin-bottom-nav">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => handleItemClick(item.path)}
            title={item.label}
            style={{ position: 'relative' }}
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Icon size={24} />
              {item.path === '/admin/orders' && newOrdersCount > 0 && (
                <span className="bottom-nav-badge" style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-10px',
                  background: '#16a34a',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: '700',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  minWidth: '12px',
                  textAlign: 'center',
                  lineHeight: '1.2'
                }}>
                  {newOrdersCount}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default AdminBottomNav;
