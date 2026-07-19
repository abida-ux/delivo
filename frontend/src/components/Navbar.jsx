import {useState, useEffect, useContext} from 'react';
import {
  Search,
  ShoppingCart,
  ShoppingBag,
  Bell,
  MapPin,
  User,
  Settings,
  Home,
  UtensilsCrossed,
  Store,
  Briefcase,
  Info,
  X,
  Trash2,
  LogIn,
  LogOut,
  AlertCircle,
  HeartPulse
} from 'lucide-react';

import { useNavigate, useLocation } from "react-router-dom";
import { AuthModalContext } from '../context/AuthModalContext';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCartUI } from '../context/CartUIContext';
import CheckoutModal from '../pages/customer/CheckoutModal';
import api, { getAppSettings } from '../services/api';
import './Navbar.css';
import './NotificationModal.css';

const Navbar = () => {
  // ✅ GET CONTEXT VALUES FIRST (before using them)
  const { user, token, logout } = useContext(AuthContext);
  const { openLoginModal } = useContext(AuthModalContext);
  const { getCartItems, removeItem, updateQuantity, clearCart } = useCart();
  const { isCartOpen, openCart, closeCart, isCheckoutOpen, openCheckout, closeCheckout } = useCartUI();

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ STATE
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeItem, setActiveItem] = useState('Home');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [promoNotificationsEnabled, setPromoNotificationsEnabled] = useState(true);

  // ✅ DERIVED DATA
  const cartItems = getCartItems();
  const isAuthenticated = !!user;
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const visibleNotifications = notifications.filter((notif) => {
    if (notif.type !== 'promotion') {
      return true;
    }

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

  // ✅ FETCH NOTIFICATIONS FROM BACKEND
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user, token]);

  const fetchNotifications = async () => {
    if (!token || !user) return;

    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

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

  const closeNotifications = () => setShowNotifications(false);

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
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

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
              onClick={() => {
                openCart();
              }}
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

            {/* ✅ AUTH BUTTON - ALWAYS UPDATES BASED ON isAuthenticated */}
            {isAuthenticated ? (
              <>
                {console.log('🔴 RENDERING LOGOUT BUTTON')}
                <button
                  className="icon-btn"
                  onClick={handleLogoutClick}
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <>
                {console.log('🟢 RENDERING LOGIN BUTTON')}
                <button
                  className="icon-btn"
                  onClick={openLoginModal}
                  title="Login"
                >
                  <User size={20} />
                </button>
              </>
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
        {showNotifications && (
          <div className="notifications-modal-overlay" onClick={closeNotifications}>
            <div className="notifications-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="notifications-modal-header">
                <h2>Notifications</h2>
                <button className="notifications-modal-close" onClick={closeNotifications}>
                  <X size={24} />
                </button>
              </div>

              <div className="notifications-modal-items">
                {visibleNotifications.length > 0 ? (
                  visibleNotifications.map((notif) => (
                    <div key={notif._id} className="notification-item">
                      <div className="notification-content">
                        <p className="notification-title">{notif.title}</p>
                        <p className="notification-message">{notif.message}</p>
                        <span className="notification-time">
                          {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button 
                        className="notification-close-btn" 
                        onClick={() => deleteNotification(notif._id)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="notifications-empty-state">
                    <Bell size={48} />
                    <h3>No notifications</h3>
                    <p>You're all caught up!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CART MODAL */}
        {isCartOpen && (
          <div className="cart-modal-overlay" onClick={closeCart}>
            <div className="cart-modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="cart-modal-header">
                <h2>Your Cart</h2>
                <button className="cart-modal-close" onClick={closeCart}>
                  <X size={24} />
                </button>
              </div>

              <div className="cart-modal-items">
                {cartItems.length > 0 ? (
                  cartItems.map((item) => {
                    // ✅ Extract foodId properly (handles both string and object)
                    const foodId = typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
                    return (
                      <div key={foodId} className="cart-item">
                        <div className="cart-item-info">
                          <h4>{item.name}</h4>
                          <p>KES {item.price}</p>
                        </div>
                        <div className="cart-item-quantity">
                          <button onClick={() => updateQuantity(foodId, item.quantity - 1)} disabled={item.quantity <= 1} className="qty-btn">−</button>
                          <span className="qty-display">{item.quantity}</span>
                          <button onClick={() => updateQuantity(foodId, item.quantity + 1)} className="qty-btn">+</button>
                        </div>
                        <button className="cart-item-remove" onClick={() => removeItem(foodId)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="cart-empty-state">
                    <ShoppingCart size={64} />
                    <h3>Zero items in your cart</h3>
                    <p>Looks like you haven't added anything yet!</p>
                    <button className="start-shopping-btn" onClick={() => {
                      closeCart();
                      navigate('/menu');
                    }}>
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="cart-modal-footer">
                  <div className="cart-total">
                    <span>Total:</span>
                    <span className="total-price">
                      KES {cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}
                    </span>
                  </div>
                  <button 
                    className="checkout-btn" 
                    onClick={() => {
                      closeCart();
                      openCheckout();
                    }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ✅ LOGOUT CONFIRMATION DIALOG */}
      {showLogoutConfirm && (
        <div className="logout-confirm-overlay" onClick={cancelLogout}>
          <div className="logout-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="logout-confirm-icon">
              <AlertCircle size={48} />
            </div>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="logout-confirm-actions">
              <button className="logout-btn-cancel" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="logout-btn-confirm" onClick={confirmLogout}>
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ CHECKOUT MODAL SIDEBAR */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={closeCheckout}
        cartItems={cartItems}
        cartTotal={cartTotal}
        onOrderSuccess={() => {
          // Handle successful order
          console.log('✅ Order placed successfully');
        }}
      />
    </>
  );
};

export default Navbar;
