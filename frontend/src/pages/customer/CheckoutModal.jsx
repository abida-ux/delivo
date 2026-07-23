import {useState, useContext, useEffect, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertCircle, Check } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { createOrder, getAppSettings, getMpesaStatus, getAllRestaurants, getOrderById } from '../../services/api';
import { saveGuestOrder } from '../../utils/orderStorage';
import './CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose, cartItems, cartTotal, onOrderSuccess, inline = false }) => {
  const { user } = useContext(AuthContext);
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const userId = user?.id || user?._id;
  const settingsKey = userId ? `delivo_settings_${userId}` : null;
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [deliverySettings, setDeliverySettings] = useState({
    enabled: true,
    amount: 20,
    freeDeliveryEnabled: false,
    freeDeliveryMinimum: 0,
  });
  const [deliveryInfo, setDeliveryInfo] = useState({
    fullName: '',
    address: '',
    whatsapp: '',
    mpesaNumber: ''
  });
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentStage, setPaymentStage] = useState('idle');
  const [orderPending, setOrderPending] = useState(false);
  const [redirectingToOrders, setRedirectingToOrders] = useState(false);
  const pollInterval = useRef(null);

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
        console.error('Error loading app settings:', error);
      }
    };

    const loadCheckoutProfile = () => {
      if (!settingsKey) return;
      try {
        const savedSettings = localStorage.getItem(settingsKey);
        if (!savedSettings) return;

        const parsed = JSON.parse(savedSettings);
        const profile = parsed?.checkoutProfile;
        if (profile) {
          setDeliveryInfo((prev) => ({
            ...prev,
            fullName: profile.fullName || prev.fullName,
            address: profile.address || prev.address,
            whatsapp: profile.whatsapp || prev.whatsapp,
            mpesaNumber: profile.mpesaNumber || prev.mpesaNumber,
          }));
        }
      } catch (error) {
        console.error('Failed to load saved checkout profile:', error);
      }
    };

    if (isOpen) {
      loadSettings();
      loadCheckoutProfile();
    }

    const onSettingsUpdated = () => {
      if (isOpen) {
        loadSettings();
        loadCheckoutProfile();
      }
    };

    const storageHandler = (e) => {
      if (e.key === 'app_settings_updated') onSettingsUpdated();
    };
    window.addEventListener('storage', storageHandler);
    window.addEventListener('app_settings_updated', onSettingsUpdated);

    return () => {
      window.removeEventListener('app_settings_updated', onSettingsUpdated);
      window.removeEventListener('storage', storageHandler);
    };
  }, [isOpen]);
  const isFreeDelivery =
    cartItems.length > 0 &&
    deliverySettings.freeDeliveryEnabled &&
    cartTotal >= deliverySettings.freeDeliveryMinimum;
  const deliveryFee = cartItems.length > 0 && !isFreeDelivery && deliverySettings.enabled ? deliverySettings.amount : 0;
  const grandTotal = (parseFloat(cartTotal) + deliveryFee).toFixed(2);

  const validateForm = () => {
    const newErrors = {};
    const phonePattern = /^(?:0(?:1|7)\d{8}|(?:\+|00)254(?:1|7)\d{8}|254(?:1|7)\d{8})$/;
    const selectedRestaurantData = restaurants.find((restaurant) => (restaurant._id || restaurant.id) === selectedRestaurant);

    if (!deliveryInfo.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!selectedRestaurant) {
      // If a restaurant is not explicitly picked, auto-pick the first open restaurant if available
      const openRest = restaurants.find((r) => r.isOpen !== false);
      if (openRest) {
        setSelectedRestaurant(openRest._id || openRest.id);
      } else if (restaurants.length > 0) {
        newErrors.restaurant = 'Please choose a restaurant to order from';
      }
    } else if (selectedRestaurantData && selectedRestaurantData.isOpen === false) {
      newErrors.restaurant = 'This restaurant is currently closed and cannot receive orders right now';
    }

    if (!deliveryInfo.address.trim()) {
      newErrors.address = 'Precise delivery location is required';
    } else if (deliveryInfo.address.trim().length < 8) {
      newErrors.address = 'Please include a clear landmark or house/room detail';
    }
    if (!deliveryInfo.whatsapp.trim()) {
      newErrors.whatsapp = 'WhatsApp number is required';
    } else {
      const normalizedWhatsApp = deliveryInfo.whatsapp.replace(/[^0-9+]/g, '');
      if (!phonePattern.test(normalizedWhatsApp)) {
        newErrors.whatsapp = 'Enter a valid Kenyan WhatsApp number like 0712345678, 0112345678, or +254712345678';
      }
    }
    if (!deliveryInfo.mpesaNumber.trim()) {
      newErrors.mpesaNumber = 'M-Pesa number is required';
    } else {
      const normalizedMpesaNumber = deliveryInfo.mpesaNumber.replace(/[^0-9+]/g, '');
      if (!phonePattern.test(normalizedMpesaNumber)) {
        newErrors.mpesaNumber = 'Enter a valid Kenyan M-Pesa number like 0712345678, 0112345678, or +254712345678';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  useEffect(() => {
    // fetch available restaurants for the select list
    const fetchRestaurants = async () => {
      try {
        const data = await getAllRestaurants();
        const allRestaurants = Array.isArray(data) ? data : [];
        setRestaurants(allRestaurants);

        const openRestaurants = allRestaurants.filter((restaurant) => restaurant.isOpen !== false);
        
        let defaultId = '';
        if (cartItems && cartItems.length > 0) {
          const firstItem = cartItems[0];
          const raw = firstItem?.restaurantId || firstItem?.restaurant || firstItem?.foodId?.restaurant;
          if (raw) {
            const id = typeof raw === 'object' ? (raw._id || raw.id) : raw;
            const found = openRestaurants.find((r) => (r._id || r.id) === id);
            if (found) defaultId = found._id || found.id;
          }
        }

        if (!defaultId && openRestaurants.length > 0) {
          defaultId = openRestaurants[0]._id || openRestaurants[0].id || '';
        }

        setSelectedRestaurant((currentSelection) => currentSelection || defaultId);
      } catch (err) {
        console.error('Error loading restaurants for checkout:', err);
      }
    };

    fetchRestaurants();

    return () => {
      clearPolling();
    };
  }, []);


  const checkOrderStatus = async (id, checkoutRequestIdValue) => {
    try {
      let updatedOrder = null;
      if (checkoutRequestIdValue) {
        try {
          updatedOrder = await getMpesaStatus(checkoutRequestIdValue);
        } catch (e) {
          console.warn('getMpesaStatus error during poll, trying getOrderById fallback:', e);
        }
      }
      if (!updatedOrder && id) {
        try {
          updatedOrder = await getOrderById(id);
        } catch (e) {
          console.warn('getOrderById fallback error:', e);
        }
      }

      if (!updatedOrder) return;

      const currentStatus = updatedOrder.paymentStatus || updatedOrder.status;
      setPaymentStatus(currentStatus);

      if (currentStatus === 'completed' || currentStatus === 'confirmed') {
        clearPolling();
        setPaymentStage('success');
        setPaymentMessage('Payment confirmed. Redirecting to your orders page...');
        setRedirectingToOrders(true);
        setOrderPending(false);
        if (!user) {
          saveGuestOrder(updatedOrder);
        }
        clearCart();
        onOrderSuccess(updatedOrder);
        window.setTimeout(() => {
          onClose?.();
          navigate('/customer/orders');
        }, 1800);
        return;
      }

      if (currentStatus === 'failed' || currentStatus === 'cancelled') {
        clearPolling();
        setPaymentStage('failed');
        setPaymentMessage('Payment failed or cancelled. Please retry the M-Pesa prompt.');
        setOrderPending(false);
        return;
      }

      setPaymentStage('pending');
      setPaymentMessage('M-Pesa prompt sent. Waiting for payment confirmation...');
    } catch (error) {
      console.error('Error polling order status:', error);
    }
  };


  const startPaymentPolling = async (id, checkoutRequestIdValue) => {
    if (pollInterval.current) {
      clearPolling();
    }

    setOrderPending(true);
    setPaymentStage('pending');
    setPaymentMessage('M-Pesa prompt sent. Waiting for payment confirmation...');
    await checkOrderStatus(id, checkoutRequestIdValue);
    pollInterval.current = setInterval(() => {
      checkOrderStatus(id, checkoutRequestIdValue);
    }, 1000);
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    try {
      const items = cartItems.map(item => ({
        foodId: item.foodId._id || item.foodId,
        quantity: item.quantity,
        price: item.price,
      }));

      const orderData = {
        items,
        customerName: deliveryInfo.fullName,
        deliveryAddress: deliveryInfo.address,
        paymentMethod: 'mpesa',
        whatsappNumber: deliveryInfo.whatsapp,
        mpesaNumber: deliveryInfo.mpesaNumber,
        deliveryFee,
        specialInstructions: '',
        restaurantId: selectedRestaurant || undefined,
      };

      if (user && user.id) {
        orderData.userId = user.id;
      } else {
        orderData.guestEmail = '';
      }

      console.log('🛒 Creating order with data:', orderData);

      const response = await createOrder(orderData);

      console.log('✅ Order created successfully:', response);
      setOrderId(response._id);
      setCheckoutRequestId(response.checkoutRequestId);
      setPaymentStatus(response.paymentStatus);
      setErrors({});
      startPaymentPolling(response._id, response.checkoutRequestId);
    } catch (error) {
      console.error('❌ Error creating order:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to place order';
      setErrors({ submit: errorMsg });
      setPaymentStage('failed');
      setPaymentMessage(errorMsg);
      setOrderPending(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const renderCheckoutContent = () => (
    <>
      <div className="checkout-modal-header">
        <h2>Complete Your Order</h2>
        <button className="close-btn" onClick={onClose} disabled={isProcessing || orderPending}>
          <X size={24} />
        </button>
      </div>

      <div className="checkout-modal-content">
        {errors.submit && (
          <div className="error-alert">
            <AlertCircle size={20} />
            <span>{errors.submit}</span>
          </div>
        )}

        <div className="checkout-summary">
          <h3>📋 Order Summary</h3>
          <div className="summary-items">
            {cartItems.map((item) => {
              const foodId = typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
              return (
                <div key={foodId} className="summary-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">x{item.quantity}</span>
                  </div>
                  <span className="item-total">KES {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <div className="summary-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>KES {cartTotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Delivery Fee</span>
              <span>KES {deliveryFee.toFixed(2)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span className="grand-total-amount">KES {grandTotal}</span>
            </div>
          </div>
        </div>

        <form className="checkout-form" onSubmit={(e) => { e.preventDefault(); handlePlaceOrder(); }}>
          <div className="form-section">
            <h4>Customer Details</h4>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={deliveryInfo.fullName}
                onChange={(e) => {
                  setDeliveryInfo({ ...deliveryInfo, fullName: e.target.value });
                  if (errors.fullName) setErrors({ ...errors, fullName: '' });
                }}
                placeholder="Enter your full name"
                disabled={isProcessing || orderPending}
                className={errors.fullName ? 'error' : ''}
              />
              {errors.fullName && <span className="field-error">{errors.fullName}</span>}
            </div>
            <div className="form-group">
              <label>Restaurant *</label>
              <select
                value={selectedRestaurant}
                onChange={(e) => {
                  setSelectedRestaurant(e.target.value);
                  if (errors.restaurant) setErrors({ ...errors, restaurant: '' });
                }}
                disabled={isProcessing || orderPending}
                className={errors.restaurant ? 'error' : ''}
              >
                <option value="">Select restaurant</option>
                {restaurants.map((r) => {
                  const id = r._id || r.id;
                  const disabled = r.isOpen === false;
                  return (
                    <option key={id} value={id} disabled={disabled}>
                      {r.name}{disabled ? ' — Closed' : ''}
                    </option>
                  );
                })}
              </select>
              {restaurants.length === 0 ? (
                <span className="field-error">No restaurants are currently accepting orders. Please try again later.</span>
              ) : null}
              {restaurants.length > 0 && restaurants.every((restaurant) => restaurant.isOpen === false) ? (
                <span className="field-error">All restaurants are currently closed. Please try again later.</span>
              ) : null}
              {errors.restaurant && <span className="field-error">{errors.restaurant}</span>}
            </div>
          </div>

          <div className="form-section">
            <h4>Delivery Location</h4>
            <div className="form-group">
              <label>Precise delivery location *</label>
              <input
                type="text"
                value={deliveryInfo.address}
                onChange={(e) => {
                  setDeliveryInfo({ ...deliveryInfo, address: e.target.value });
                  if (errors.address) setErrors({ ...errors, address: '' });
                }}
                placeholder="House number, apartment, gate, landmark, or street"
                disabled={isProcessing || orderPending}
                className={errors.address ? 'error' : ''}
              />
              {errors.address && <span className="field-error">{errors.address}</span>}
            </div>
          </div>

          <div className="form-section">
            <h4>M-Pesa Payment</h4>
            <div className="form-group">
              <label>M-Pesa Number *</label>
              <input
                type="tel"
                value={deliveryInfo.mpesaNumber}
                onChange={(e) => {
                  setDeliveryInfo({ ...deliveryInfo, mpesaNumber: e.target.value });
                  if (errors.mpesaNumber) setErrors({ ...errors, mpesaNumber: '' });
                }}
                placeholder="0722 000 000"
                disabled={isProcessing || orderPending}
                className={errors.mpesaNumber ? 'error' : ''}
              />
              {errors.mpesaNumber && <span className="field-error">{errors.mpesaNumber}</span>}
            </div>
            <div className="payment-note">
              M-Pesa prompt will be sent to this number.
            </div>
          </div>

          <div className="form-section">
            <h4>Contact Details</h4>
            <div className="form-group">
              <label>WhatsApp Number *</label>
              <input
                type="tel"
                value={deliveryInfo.whatsapp}
                onChange={(e) => {
                  setDeliveryInfo({ ...deliveryInfo, whatsapp: e.target.value });
                  if (errors.whatsapp) setErrors({ ...errors, whatsapp: '' });
                }}
                placeholder="0722 000 000"
                disabled={isProcessing || orderPending}
                className={errors.whatsapp ? 'error' : ''}
              />
              {errors.whatsapp && <span className="field-error">{errors.whatsapp}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isProcessing || orderPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="confirm-btn"
              disabled={isProcessing || orderPending}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Place Order - KES {grandTotal}
                </>
              )}
            </button>
          </div>
        </form>

        {paymentStage === 'success' ? (
          <div className="payment-success-state">
            <div className="payment-success-ring">
              <Check size={28} />
            </div>
            <h3>Payment Completed</h3>
            <p>{paymentMessage}</p>
            <p className="payment-success-subtext">
              {redirectingToOrders ? 'Please wait while we open your orders page.' : 'You will be taken to your orders page shortly.'}
            </p>
          </div>
        ) : paymentMessage ? (
          <div className="payment-status-box">
            <div className="payment-status-title">Payment Status</div>
            <p>{paymentMessage}</p>
            {checkoutRequestId && (
              <p className="payment-subtext">Checkout Request ID: {checkoutRequestId}</p>
            )}
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <div className={`checkout-modal-overlay ${inline ? 'inline' : ''}`}>
      <div className={`checkout-modal-container ${inline ? 'inline' : ''}`}>
        {renderCheckoutContent()}
      </div>
    </div>
  );
};

export default CheckoutModal;
