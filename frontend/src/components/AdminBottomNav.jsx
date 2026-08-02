import { useContext } from 'react';
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
import './AdminBottomNav.css';

const AdminBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);

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
          >
            <Icon size={24} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default AdminBottomNav;
