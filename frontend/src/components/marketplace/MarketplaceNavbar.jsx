import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShoppingCart,
  ShoppingBag,
  Bell,
  User,
  Settings,
  Grid,
  Heart,
  PackageCheck,
  ArrowLeft,
  LogOut,
  Tag
} from 'lucide-react';
import { useMarketplaceCart } from '../../contexts/marketplace/MarketplaceCartContext';
import { AuthContext } from '../../context/AuthContext';
import { AuthModalContext } from '../../context/AuthModalContext';
import MarketplaceCartDrawer from './MarketplaceCartDrawer';
import LogoutModal from '../LogoutModal';
import ReturnToFoodModal from './ReturnToFoodModal';
import { LoaderContext } from '../../context/LoaderContext';
import './MarketplaceNavbar.css';

export default function MarketplaceNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { openLoginModal } = useContext(AuthModalContext);
  const { showLoader, hideLoader } = useContext(LoaderContext);
  const { totalItemCount, openMarketplaceCart } = useMarketplaceCart();

  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Marketplace', path: '/marketplace', icon: <ShoppingBag size={18} /> },
    { name: 'Categories', path: '/marketplace/categories', icon: <Grid size={18} /> },
    { name: 'Second-Hand', path: '/marketplace/second-hand', icon: <Tag size={18} /> },
    { name: 'Wishlist', path: '/marketplace/wishlist', icon: <Heart size={18} /> },
    { name: 'Orders', path: '/marketplace/orders', icon: <PackageCheck size={18} /> },
  ];

  return (
    <>
      <nav className={`mkt-navbar-container ${isScrolled ? 'scrolled' : ''}`}>
        <div className="mkt-navbar-glass">

          {/* LEFT: LOGO + BRAND + RETURN TO FOOD LINK */}
          <div className="mkt-navbar-left">
            <Link to="/marketplace" className="mkt-brand-link">
              <div className="mkt-logo-image">
                <img src="/delivo.jpg" alt="Delivo Marketplace" />
              </div>
              <span className="mkt-brand-name">Delivo</span>
              <span className="mkt-brand-subtag">Marketplace</span>
            </Link>

            <button
              type="button"
              className="mkt-return-food-pill"
              onClick={() => setShowReturnModal(true)}
              title="Return to Delivo Food Delivery"
            >
              <ArrowLeft size={14} />
              <span>Food Delivery</span>
            </button>
          </div>

          {/* CENTER: NAV LINKS */}
          <div className="mkt-navbar-center">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  type="button"
                  className={`mkt-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* RIGHT: ACTIONS */}
          <div className="mkt-navbar-right">
            <button
              className="mkt-icon-btn mkt-cart-icon-btn"
              onClick={openMarketplaceCart}
              title="Marketplace Cart"
            >
              <ShoppingCart size={20} />
              {totalItemCount > 0 && <span className="mkt-cart-badge">{totalItemCount}</span>}
            </button>

            {user ? (
              <button
                className="mkt-icon-btn"
                onClick={() => setShowLogoutModal(true)}
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            ) : (
              <button
                className="mkt-icon-btn"
                onClick={openLoginModal}
                title="Sign In"
              >
                <User size={20} />
              </button>
            )}
          </div>
        </div>

        {/* MOBILE BOTTOM NAVBAR */}
        <div className="mkt-mobile-bottom-navbar">
          <button className="mkt-mobile-bottom-icon" onClick={() => setShowReturnModal(true)}>
            <ArrowLeft size={20} />
            <span className="mkt-mobile-icon-label">Food</span>
          </button>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                className={`mkt-mobile-bottom-icon ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                <span className="mkt-mobile-icon-label">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <MarketplaceCartDrawer />

      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
          navigate('/marketplace');
        }}
        onCancel={() => setShowLogoutModal(false)}
      />

      <ReturnToFoodModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onConfirm={() => {
          setShowReturnModal(false);
          showLoader();
          navigate('/');
          setTimeout(() => {
            hideLoader();
          }, 1500);
        }}
      />
    </>
  );
}
