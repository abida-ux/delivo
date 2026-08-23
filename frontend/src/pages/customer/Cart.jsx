import { useState, useContext, useEffect, useMemo } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, Store, Star, Clock, AlertTriangle, Check, ChevronDown, Sparkles, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import CheckoutModal from './CheckoutModal';
import RestaurantPickerModal from '../../components/RestaurantPickerModal';
import { getAppSettings } from '../../services/api';
import { resolveImageUrl } from '../../utils/placeholderImage';
import '../pages.css';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const {
    cartItems,
    removeItem,
    updateQuantity,
    updateItemRestaurant,
    clearCart,
    getCartTotal,
    hasUnassignedItems,
  } = useCart();

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState(null);

  // Restaurant picker modal state
  const [pickerItem, setPickerItem] = useState(null);

  const [deliverySettings, setDeliverySettings] = useState({
    enabled: true,
    amount: 20,
    freeDeliveryEnabled: false,
    freeDeliveryMinimum: 2500,
  });

  const [partnerRestaurants, setPartnerRestaurants] = useState([]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await fetch('/api/restaurants');
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          setPartnerRestaurants(data.data);
        } else if (Array.isArray(data)) {
          setPartnerRestaurants(data);
        }
      } catch (err) {
        console.warn('Failed to load partner restaurants:', err);
      }
    };
    fetchPartners();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getAppSettings();
        setDeliverySettings({
          enabled: settings.deliveryFeeEnabled !== false,
          amount: settings.deliveryFeeAmount != null ? Number(settings.deliveryFeeAmount) : 20,
          freeDeliveryEnabled: settings.freeDeliveryEnabled === true,
          freeDeliveryMinimum: settings.freeDeliveryMinimum != null ? Number(settings.freeDeliveryMinimum) : 2500,
        });
      } catch (error) {
        console.error('Error loading delivery settings:', error);
      }
    };

    loadSettings();

    const onSettingsUpdated = () => loadSettings();
    window.addEventListener('storage', onSettingsUpdated);
    window.addEventListener('app_settings_updated', onSettingsUpdated);

    return () => {
      window.removeEventListener('app_settings_updated', onSettingsUpdated);
      window.removeEventListener('storage', onSettingsUpdated);
    };
  }, []);

  const getNormalizedFoodId = (item) => {
    if (!item) return null;
    if (item.productType === 'marketplace') {
      return item.marketplaceProductId || item.foodId || item._id;
    }
    return typeof item.foodId === 'object' && item.foodId !== null ? item.foodId._id : item.foodId;
  };

  const getNormalizedRestaurantId = (item) => {
    if (!item || !item.restaurantId) return null;
    return typeof item.restaurantId === 'object' ? item.restaurantId._id : item.restaurantId;
  };

  const handleSelectRestaurant = (option) => {
    if (!pickerItem) return;
    const foodId = getNormalizedFoodId(pickerItem);
    const targetRestId = option.restaurantId || option._id || option.id;
    const targetRestName = option.name;
    const targetPrice = option.price;

    updateItemRestaurant(foodId, targetRestId, targetRestName, targetPrice);
    setPickerItem(null);
  };

  // Group items for display
  const { restaurantGroups, marketplaceItems } = useMemo(() => {
    const restMap = {};
    const marketplace = [];

    cartItems.forEach((item) => {
      if (item.productType === 'marketplace') {
        marketplace.push(item);
      } else {
        const restId = getNormalizedRestaurantId(item) || 'restaurant_general';
        const restName = item.restaurantName || 'Campus Restaurant';
        if (!restMap[restId]) {
          restMap[restId] = {
            restaurantId: restId,
            restaurantName: restName,
            items: [],
            subtotal: 0,
          };
        }
        restMap[restId].items.push(item);
        restMap[restId].subtotal += (Number(item.price) || 0) * (Number(item.quantity) || 1);
      }
    });

    return {
      restaurantGroups: Object.values(restMap),
      marketplaceItems: marketplace,
    };
  }, [cartItems]);

  const uniqueRestaurantCount = Math.max(1, restaurantGroups.length);
  const cartTotal = getCartTotal();
  const isFreeDeliveryEligible = !deliverySettings.enabled || (deliverySettings.freeDeliveryEnabled && cartTotal >= deliverySettings.freeDeliveryMinimum);
  const baseFee = deliverySettings.enabled ? deliverySettings.amount : 0;
  const deliveryFee = isFreeDeliveryEligible ? 0 : uniqueRestaurantCount * baseFee;
  const grandTotal = (cartTotal + deliveryFee).toFixed(2);
  const isCheckoutDisabled = cartItems.length === 0;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }
    setShowCheckoutModal(true);
  };

  const handleOrderSuccess = (orderData) => {
    setOrderConfirmation(orderData);
  };

  return (
    <div className="cart-container">
      {/* Order Confirmation Toast */}
      {orderConfirmation && (
        <div className="confirmation-toast">
          <div className="toast-icon">✓</div>
          <div className="toast-content">
            <h3>Order Placed!</h3>
            <p>Order ID: #{orderConfirmation._id?.slice(-6).toUpperCase()}</p>
            <p>
              {orderConfirmation.paymentStatus === 'completed'
                ? 'Payment confirmed. Redirecting to your orders...'
                : 'M-Pesa payment prompt sent. Please approve on your phone.'}
            </p>
          </div>
        </div>
      )}

      {/* Cart Header */}
      <div className="cart-header">
        <button className="back-btn" onClick={() => navigate(-1)} title="Go back">
          <ArrowLeft size={20} />
        </button>
        <div className="cart-header-title-block">
          <h1 className="cart-title">Your Cart</h1>
          <span className="cart-item-count-badge">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        {cartItems.length > 0 && (
          <button className="cart-clear-link" onClick={clearCart}>
            Clear Cart
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart-card">
          <div className="empty-cart-icon-wrap">
            <ShoppingCart size={44} />
          </div>
          <h2>Your cart is empty</h2>
          <p>Explore delicious dishes from verified campus restaurants.</p>
          <button className="start-shopping-btn" onClick={() => navigate('/menu')}>
            Explore Food Catalog
          </button>
        </div>
      ) : (
        <div className="cart-content-grid">
          {/* Main Cart Items Column */}
          <div className="cart-items-column">
            {/* Grouped Restaurant Sections */}
            {restaurantGroups.map((group) => (
              <div key={group.restaurantId} className="cart-group-card assigned-group">
                <div className="group-header">
                  <div className="group-title-row">
                    <div className="store-avatar">
                      <Store size={16} />
                    </div>
                    <div>
                      <span className="group-vendor-label">FROM RESTAURANT</span>
                      <h3 className="group-restaurant-name">{group.restaurantName}</h3>
                    </div>
                  </div>
                  <span className="group-subtotal-badge">
                    Subtotal: KES {group.subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="group-items-list">
                  {group.items.map((item) => {
                    const itemId = getNormalizedFoodId(item);
                    const unitPrice = Number(item.price) || 0;
                    const itemTotal = unitPrice * (item.quantity || 1);

                    return (
                      <div key={itemId} className="cart-item-card">
                        <img
                          src={resolveImageUrl(item.image)}
                          alt={item.name}
                          className="cart-item-img"
                        />
                        <div className="cart-item-main">
                          <h4 className="item-title">
                            {item.name}
                            {item.portionName && (
                              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#FF6B4A', background: '#fff5f2', border: '1px solid #ffcfc5', padding: '2px 8px', borderRadius: '6px', marginLeft: '8px', display: 'inline-block' }}>
                                Portion: {item.portionName}
                              </span>
                            )}
                          </h4>
                          {item.isCombination && item.components && (
                            <div className="combo-sub-components">
                              {item.components.map((comp, idx) => (
                                <span key={idx}>• {comp.name} ×{comp.quantity}</span>
                              ))}
                            </div>
                          )}

                          {/* IN-PLACE RESTAURANT SELECTION CONTROL */}
                          <div className="cart-item-restaurant-ctrl">
                            <div className="assigned-restaurant-chip-row">
                              <span className="ctrl-label-assigned">Restaurant:</span>
                              <button
                                type="button"
                                className="choose-restaurant-btn assigned"
                                onClick={() => setPickerItem(item)}
                                title="Click to change restaurant"
                              >
                                <Store size={12} />
                                <span>{item.restaurantName || 'Restaurant'}</span>
                                <ChevronDown size={13} />
                              </button>
                            </div>
                            <span className="item-unit-price">KES {unitPrice.toLocaleString()} each</span>
                          </div>
                        </div>

                        <div className="cart-item-qty-wrap">
                          <button
                            className="qty-stepper-btn"
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="qty-val">{item.quantity}</span>
                          <button
                            className="qty-stepper-btn"
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="cart-item-total-col">
                          KES {itemTotal.toLocaleString()}
                        </div>

                        <button
                          className="cart-item-del-btn"
                          onClick={() => removeItem(itemId)}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* 4. Marketplace Groceries (if any) */}
            {marketplaceItems.length > 0 && (
              <div className="cart-group-card marketplace-group">
                <div className="group-header">
                  <div className="group-title-row">
                    <span className="group-badge">Marketplace & Groceries</span>
                  </div>
                </div>
                <div className="group-items-list">
                  {marketplaceItems.map((item) => {
                    const itemId = getNormalizedFoodId(item);
                    const unitPrice = Number(item.price) || 0;
                    const itemTotal = unitPrice * (item.quantity || 1);
                    return (
                      <div key={itemId} className="cart-item-card">
                        <img
                          src={resolveImageUrl(item.image)}
                          alt={item.name}
                          className="cart-item-img"
                        />
                        <div className="cart-item-main">
                          <h4 className="item-title">{item.name}</h4>
                          <span className="item-unit-price">KES {unitPrice.toLocaleString()} each</span>
                        </div>
                        <div className="cart-item-qty-wrap">
                          <button
                            className="qty-stepper-btn"
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="qty-val">{item.quantity}</span>
                          <button
                            className="qty-stepper-btn"
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="cart-item-total-col">
                          KES {itemTotal.toLocaleString()}
                        </div>
                        <button
                          className="cart-item-del-btn"
                          onClick={() => removeItem(itemId)}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Column */}
          <div className="cart-summary-column">
            <div className="cart-summary-card">
              <h3 className="summary-title">Order Summary</h3>

              <div className="summary-rows">
                <div className="summary-line">
                  <span>Food Subtotal</span>
                  <strong>KES {cartTotal.toLocaleString()}</strong>
                </div>

                <div className="summary-line">
                  <div className="fee-label-wrap">
                    <span>Delivery Fee</span>
                    {uniqueRestaurantCount > 1 && (
                      <span className="multi-pickup-note">
                        ({uniqueRestaurantCount} restaurant pickups)
                      </span>
                    )}
                  </div>
                  <strong>
                    {isFreeDeliveryEligible ? (
                      <span className="free-badge">FREE</span>
                    ) : (
                      `KES ${deliveryFee.toLocaleString()}`
                    )}
                  </strong>
                </div>

                {uniqueRestaurantCount > 1 && (
                  <div className="multi-vendor-info-chip">
                    <Truck size={14} />
                    <span>Combined delivery from {uniqueRestaurantCount} kitchens in 1 order</span>
                  </div>
                )}

                <div className="summary-divider"></div>

                <div className="summary-line total-line">
                  <span>Estimated Total</span>
                  <strong className="grand-total-val">KES {Number(grandTotal).toLocaleString()}</strong>
                </div>
              </div>

              <button
                className="checkout-action-btn"
                onClick={handleCheckout}
                disabled={isCheckoutDisabled}
              >
                Proceed to Checkout
              </button>
            </div>

            {/* Partner Restaurants Info Block */}
            <div className="partner-restaurants-card">
              <div className="partner-card-header">
                <Store size={18} className="partner-header-icon" />
                <div>
                  <h4 className="partner-card-title">Partner Restaurants</h4>
                  <p className="partner-card-sub">Available campus partners</p>
                </div>
              </div>

              <div className="partner-restaurants-list">
                {partnerRestaurants.length > 0 ? (
                  partnerRestaurants.map((restaurant) => (
                    <div key={restaurant._id} className="partner-restaurant-chip">
                      <span className="partner-chip-dot"></span>
                      <span className="partner-chip-name">{restaurant.name}</span>
                    </div>
                  ))
                ) : (
                  <span className="partner-loading-text">Loading partner restaurants...</span>
                )}
              </div>

              <div className="partner-info-note">
                <span>ℹ️ Restaurant assignment is managed automatically for your order items.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal (Read-Only Group Summary) */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cartItems={cartItems}
        cartTotal={cartTotal}
        onOrderSuccess={handleOrderSuccess}
      />
    </div>
  );
};

export default Cart;
