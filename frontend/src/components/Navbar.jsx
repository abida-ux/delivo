import {useState, useEffect, useContext} from 'react';
import {
  ShoppingCart,
  ShoppingBag,
  Bell,
  User,
  Settings,
  Home,
  UtensilsCrossed,
  LogOut,
  HeartPulse
} from 'lucide-react';

import { useNavigate, useLocation } from "react-router-dom";
import { AuthModalContext } from '../context/AuthModalContext';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCartUI } from '../context/CartUIContext';
import CheckoutModal from '../pages/customer/CheckoutModal';
import CartDrawer from './CartDrawer';
import NotificationModal from './NotificationModal';
import LogoutModal from './LogoutModal';
import api, { getAppSettings } from '../services/api';
import './Navbar.css';

const Navbar = () => {
  // ✅ GET CONTEXT VALUES FIRST (before using them)
  const { user, token, logout } = useContext(AuthContext);
  const { openLoginModal } = useContext(AuthModalContext);
  const { getCartItems } = useCart();
  const { isCheckoutOpen, openCart, openCheckout, closeCheckout } = useCartUI();

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ STATE
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeItem, setActiveItem] = useState('Home');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [promoNotificationsEnabled, setPromoNotificationsEnabled] = useState(true);

  // ✅ DERIVED DATA
  const cartItems = getCartItems();
  const isAuthenticated = !!user;
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const visibleNotifications = notifications.filter((notif) => {
    if (notif.type !== 'promotion') return true;
    return promoNotificationsEnabled;
  });

  useEffect(() => {
    const loadAppSettings = async () => {
      try {
        const settings = await getAppSettings();
        setPromoNotificationsEnabled(settings.promoNotifications !== false);
      } catch (error) {
        console.error('Error loading app settings for notifications:', error);
      }
    };

    loadAppSettings();
  }, []);

  const fetchNotifications = async () => {
    if (!token || !user) return;

    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // ✅ FETCH NOTIFICATIONS FROM BACKEND
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);

      const handleFocus = () => fetchNotifications();
      const handleVisibility = () => {
        if (!document.hidden) {
          fetchNotifications();
        }
      };

      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    } else {
      setNotifications([]);
    }
  }, [user, token]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    const handleServiceWorkerMessage = (event) => {
      if (event.data?.type === 'DELIVO_PUSH_RECEIVED') {
        fetchNotifications();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
  }, [user, token]);

  // ✅ DELETE NOTIFICATION
  const deleteNotification = async (notificationId) => {
    if (!token) return;

    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((current) => current.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ SYNC ACTIVE ITEM WITH CURRENT ROUTE
  useEffect(() => {
    const routeToLinkMap = {
      '/': 'Home',
      '/menu': 'Menu',
      '/wishlist': 'Wishlist',
      '/customer/orders': 'Orders'
    };

    const currentLink = routeToLinkMap[location.pathname] || 'Home';
    setActiveItem(currentLink);
  }, [location.pathname]);

  // ✅ HANDLE LOGOUT WITH CONFIRMATION
  const handleLogoutClick = () => setShowLogoutConfirm(true);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const cancelLogout = () => setShowLogoutConfirm(false);

  const navLinks = ['Home', 'Menu', 'Wishlist', 'Orders'];

  const iconMap = {
    Home: <Home size={18} />,
    Menu: <UtensilsCrossed size={18} />,
    Wishlist: <HeartPulse size={18} />,
    Orders: <ShoppingBag size={18} />
  };

  const routeMap = {
    Home: "/",
    Menu: "/menu",
    Wishlist: "/wishlist",
    Orders: "/customer/orders"
  };

  const handleNavigate = (link) => {
    setActiveItem(link);
    navigate(routeMap[link]);

    if (link === 'Home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className={`navbar-container ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-glass">

          {/* LEFT: LOGO */}
          <div className="navbar-left">
            <div className="logo-image">
              <img src="/delivos.png" alt="Delivo" />
            </div>
            <span className="brand-name">Delivo</span>
          </div>

          {/* CENTER: NAV LINKS */}
          <div className="navbar-center">
            {navLinks.map((link) => (
              <button
                key={link}
                className={`nav-link ${activeItem === link ? 'active' : ''}`}
                onClick={() => handleNavigate(link)}
              >
                {iconMap[link]}
                <span>{link}</span>
                {activeItem === link && <span className="active-glow" />}
              </button>
            ))}
          </div>

          {/* RIGHT: ACTIONS */}
          <div className="navbar-right">

            <button
              className="icon-btn cart-icon-btn"
              onClick={openCart}
            >
              <ShoppingCart size={20} />
              {cartItems.length > 0 && (
                <span className="cart-badge">{cartItems.length}</span>
              )}
            </button>

            <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)} title="Notifications">
              <Bell size={20} />
              {visibleNotifications.length > 0 && (
                <span className="notification-badge">{visibleNotifications.length}</span>
              )}
            </button>

            {/* ✅ AUTH BUTTON */}
            {isAuthenticated ? (
              <button
                className="icon-btn"
                onClick={handleLogoutClick}
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            ) : (
              <button
                className="icon-btn"
                onClick={openLoginModal}
                title="Login"
              >
                <User size={20} />
              </button>
            )}

            <button className="icon-btn" onClick={() => navigate('/settings')} title="Settings">
              <Settings size={20} />
            </button>

            {/* OPTIONAL: avatar stays */}
            <div className="avatar-wrapper">
              <div className="avatar-placeholder">U</div>
            </div>

          </div>
        </div>

        {/* MOBILE BOTTOM NAVBAR */}
        <div className="mobile-bottom-navbar">
          {navLinks.map((link) => (
            <button
              key={link}
              className={`mobile-bottom-icon ${activeItem === link ? 'active' : ''}`}
              onClick={() => handleNavigate(link)}
              title={link}
            >
              {iconMap[link]}
              <span className="mobile-icon-label">{link}</span>
            </button>
          ))}
        </div>

        {/* NOTIFICATIONS MODAL */}
        <NotificationModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          notifications={visibleNotifications}
          onDelete={deleteNotification}
        />

        {/* CART DRAWER */}
        <CartDrawer />
      </nav>

      {/* ✅ LOGOUT CONFIRMATION DIALOG */}
      <LogoutModal
        isOpen={showLogoutConfirm}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />

      {/* ✅ CHECKOUT MODAL SIDEBAR */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={closeCheckout}
        cartItems={cartItems}
        cartTotal={cartTotal}
        onOrderSuccess={() => {
          // Handle successful order
        }}
      />
    </>
  );
};

export default Navbar;
