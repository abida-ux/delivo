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
  Tag
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
import MarketplaceConfirmationModal from './marketplace/MarketplaceConfirmationModal';
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
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [promoNotificationsEnabled, setPromoNotificationsEnabled] = useState(true);
  const [showOffersBadge, setShowOffersBadge] = useState(false);

  // ✅ DERIVED DATA
  const cartItems = getCartItems();
  const isAuthenticated = !!user;
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const visibleNotifications = notifications.filter((notif) => {
    if (notif.type !== 'promotion') return true;
    return promoNotificationsEnabled;
  });
  const unreadNotifications = visibleNotifications.filter((notif) => !notif.isRead);

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

  // Dynamic unseen offers badge logic
  useEffect(() => {
    const checkUnseenOffers = async () => {
      if (!user) {
        setShowOffersBadge(false);
        return;
      }
      try {
        const { data } = await api.get('/offers');
        const offersList = data.data || [];
        const seenCount = localStorage.getItem('delivo_seen_offers_count') || 0;
        
        if (offersList.length > Number(seenCount)) {
          setShowOffersBadge(true);
        } else {
          setShowOffersBadge(false);
        }
      } catch (err) {
        console.error('Error checking unseen offers for badge:', err);
      }
    };

    checkUnseenOffers();

    const handleOffersViewed = () => {
      setShowOffersBadge(false);
    };

    window.addEventListener('delivo_offers_viewed', handleOffersViewed);
    return () => {
      window.removeEventListener('delivo_offers_viewed', handleOffersViewed);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!token || !user) return;

    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // ✅ FETCH NOTIFICATIONS FROM BACKEND / DYNAMIC GUEST OFFERS PROMO
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
      // Guest users check active offers to display a synthetic promo notification
      const checkGuestOffers = async () => {
        try {
          const { data } = await api.get('/offers');
          const offersList = data.data || [];
          if (offersList.length > 0) {
            const hasDismissed = localStorage.getItem('delivo_dismissed_guest_offers') === 'true';
            if (!hasDismissed) {
              setNotifications([
                {
                  _id: 'guest_promo_notification',
                  title: 'New Exclusive Offers Available!',
                  message: 'Click here to go to the Offers page and unlock exciting deals.',
                  type: 'promotion',
                  isRead: false,
                  createdAt: new Date().toISOString(),
                  isGuestPromo: true,
                }
              ]);
            } else {
              setNotifications([]);
            }
          } else {
            setNotifications([]);
          }
        } catch (err) {
          console.error('Error fetching offers for guest notifications:', err);
          setNotifications([]);
        }
      };
      
      checkGuestOffers();
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
    if (notificationId === 'guest_promo_notification') {
      localStorage.setItem('delivo_dismissed_guest_offers', 'true');
      setNotifications([]);
      return;
    }
    if (!token) return;

    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((current) => current.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationItemClick = (notif) => {
    setShowNotifications(false);
    if (notif.isGuestPromo || notif.type === 'promotion') {
      handleNavigate('Offers');
    }
  };

  // ✅ MARK ALL AS READ ON MODAL OPEN
  const handleNotificationClick = async () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);

    if (nextState && token) {
      try {
        await api.put('/notifications/mark-all-read');
        setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
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
      '/menu': 'Meals',
      '/marketplace': 'Marketplace',
      '/offers': 'Offers',
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

  const navLinks = ['Home', 'Meals', 'Marketplace', 'Offers', 'Orders'];

  const iconMap = {
    Home: <Home size={18} />,
    Meals: <UtensilsCrossed size={18} />,
    Marketplace: <ShoppingCart size={18} />,
    Offers: <Tag size={18} />,
    Orders: <ShoppingBag size={18} />
  };

  const routeMap = {
    Home: "/",
    Meals: "/menu",
    Marketplace: "/marketplace",
    Offers: "/offers",
    Orders: "/customer/orders"
  };

  const handleNavigate = (link) => {
    if (link === 'Marketplace') {
      setShowMarketplaceModal(true);
      return;
    }

    setActiveItem(link);
    navigate(routeMap[link]);

    if (link === 'Home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (link === 'Offers') {
      setShowOffersBadge(false);
      window.dispatchEvent(new Event('delivo_offers_viewed'));
    }
  };

  return (
    <>
      <nav className={`navbar-container ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-glass">

          {/* LEFT: LOGO */}
          <div className="navbar-left">
            <div className="logo-image">
              <img src="/delivo.jpg" alt="Delivo" />
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
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  {iconMap[link]}
                  {link === 'Offers' && showOffersBadge && (
                    <span 
                      className="offers-badge" 
                      style={{ 
                        position: 'absolute', 
                        top: -5, 
                        right: -5, 
                        width: 8, 
                        height: 8, 
                        background: '#ef4444', 
                        borderRadius: '50%', 
                        border: '1.5px solid #ffffff' 
                      }} 
                    />
                  )}
                </div>
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

            <button className="icon-btn" onClick={handleNotificationClick} title="Notifications">
              <Bell size={20} />
              {unreadNotifications.length > 0 && (
                <span className="notification-badge">{unreadNotifications.length}</span>
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
          onClickItem={handleNotificationItemClick}
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

      {/* ✅ MARKETPLACE CONFIRMATION MODAL */}
      <MarketplaceConfirmationModal
        isOpen={showMarketplaceModal}
        onClose={() => setShowMarketplaceModal(false)}
        onConfirm={() => {
          setShowMarketplaceModal(false);
          navigate('/marketplace');
        }}
      />
    </>
  );
};

export default Navbar;
