import {useState, useContext, useEffect, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertCircle, Check, MapPin, ClipboardList, Map, Navigation, UserCheck } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import LocationPickerModal from '../../components/LocationPickerModal';
import api, { createOrder, getAppSettings, getMpesaStatus, getAllRestaurants, getOrderById } from '../../services/api';
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
  const { location, updateLocation, detectLocation, loading: geoLoading, error: geoError } = useLocation();
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

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
  const [locationLoading, setLocationLoading] = useState(false);
  const pollInterval = useRef(null);
  
  // Promo code / voucher states
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // Update input address from location coordinates context dynamically
  useEffect(() => {
    if (location.formattedAddress) {
      setDeliveryInfo(prev => ({
        ...prev,
        address: location.formattedAddress,
      }));
    }
  }, [location.formattedAddress]);

  // Load saved addresses on open if user is logged in
  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (user && isOpen) {
        try {
          const res = await api.get('/addresses');
          setSavedAddresses(res.data.data || []);
          const def = res.data.data?.find(a => a.isDefault);
          if (def) {
            setDeliveryInfo(prev => ({
              ...prev,
              address: def.formattedAddress,
            }));
            updateLocation(def.latitude, def.longitude, def.formattedAddress);
          }
        } catch (err) {
          console.error('Failed to load saved addresses:', err);
        }
      }
    };
    fetchSavedAddresses();
  }, [user?._id, isOpen]);

  const handleSelectSavedAddress = (addressItem) => {
    setDeliveryInfo(prev => ({
      ...prev,
      address: addressItem.formattedAddress,
    }));
    updateLocation(addressItem.latitude, addressItem.longitude, addressItem.formattedAddress);
  };

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
      let loadedFromLocal = false;
      if (settingsKey) {
        try {
          const savedSettings = localStorage.getItem(settingsKey);
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            const profile = parsed?.checkoutProfile;
            if (profile) {
              setDeliveryInfo((prev) => ({
                ...prev,
                fullName: profile.fullName || prev.fullName || user?.name || '',
                address: profile.address || prev.address || user?.location || '',
                whatsapp: profile.whatsapp || prev.whatsapp || user?.phone || '',
                mpesaNumber: profile.mpesaNumber || prev.mpesaNumber || user?.phone || '',
              }));
              loadedFromLocal = true;
            }
          }
        } catch (error) {
          console.error('Failed to load saved checkout profile:', error);
        }
      }

      if (!loadedFromLocal && user) {
        setDeliveryInfo((prev) => ({
          ...prev,
          fullName: prev.fullName || user.name || '',
          address: prev.address || user.location || '',
          whatsapp: prev.whatsapp || user.phone || '',
          mpesaNumber: prev.mpesaNumber || user.phone || '',
        }));
      }
    };

    if (isOpen) {
      loadSettings();
      loadCheckoutProfile();
      setPromoCode('');
      setAppliedPromo(null);
      setPromoError('');
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
  const deliveryFee = cartItems.length > 0 && deliverySettings.enabled ? deliverySettings.amount : 0;
  
  // Calculate discount based on applied promo
  let discountAmount = 0;
  let finalDeliveryFee = deliveryFee;
  
  if (appliedPromo) {
    const discountStr = appliedPromo.discount.toUpperCase();
    if (discountStr.includes('FREE DELIVERY')) {
      finalDeliveryFee = 0;
      discountAmount = deliveryFee;
    } else if (discountStr.includes('%')) {
      const percentage = parseFloat(discountStr.replace(/[^0-9.]/g, '')) || 0;
      discountAmount = (parseFloat(cartTotal) * (percentage / 100));
    } else {
      const fixed = parseFloat(discountStr.replace(/[^0-9.]/g, '')) || 0;
      discountAmount = fixed;
    }
  }

  const grandTotal = Math.max(0, (parseFloat(cartTotal) + finalDeliveryFee - discountAmount)).toFixed(2);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }
    setPromoLoading(true);
    setPromoError('');
    try {
      const { data } = await api.get('/offers');
      const offersList = data.data || [];
      const match = offersList.find(o => o.code.toUpperCase() === promoCode.trim().toUpperCase());
      
      if (!match) {
        setPromoError('Invalid promo code');
        setAppliedPromo(null);
      } else {
        let minOrderVal = 0;
        if (match.minOrder) {
          minOrderVal = parseFloat(match.minOrder.replace(/[^0-9.]/g, '')) || 0;
        }
        if (parseFloat(cartTotal) < minOrderVal) {
          setPromoError(`Minimum order of KES ${minOrderVal} required for this code`);
          setAppliedPromo(null);
        } else {
          setAppliedPromo(match);
          setPromoError('');
        }
      }
    } catch (err) {
      console.error('Error validating promo code:', err);
      setPromoError('Failed to validate promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

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

    if (!location.latitude || !location.longitude) {
      newErrors.address = 'Please drag the marker pin on the map to confirm your delivery coordinates';
    } else if (!deliveryInfo.address.trim()) {
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
    const fetchRestaurants = async () => {
      if (!cartItems || cartItems.length === 0) return;

      try {
        const foodIds = cartItems.map(item => {
          return typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
        }).join(',');

        const res = await api.get(`/restaurants/match?foodIds=${foodIds}`);
        const matched = res.data.data || [];
        setRestaurants(matched);

        const openRestaurants = matched.filter((restaurant) => restaurant.isOpen !== false);
        
        let defaultId = '';
        const firstItem = cartItems[0];
        const raw = firstItem?.restaurantId || firstItem?.restaurant || firstItem?.foodId?.restaurant;
        if (raw) {
          const id = typeof raw === 'object' ? (raw._id || raw.id) : raw;
          const found = openRestaurants.find((r) => (r._id || r.id) === id);
          if (found) defaultId = found._id || found.id;
        }

        if (!defaultId && openRestaurants.length > 0) {
          defaultId = openRestaurants[0]._id || openRestaurants[0].id || '';
        }

        setSelectedRestaurant((currentSelection) => currentSelection || defaultId);
      } catch (err) {
        console.error('Error loading matching restaurants for checkout:', err);
      }
    };

    if (isOpen) {
      fetchRestaurants();
    }

    return () => {
      clearPolling();
    };
  }, [isOpen, cartItems]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'DelivoFoodApp/1.0',
              },
            }
          );
          const data = await response.json();
          if (data && data.display_name) {
            setDeliveryInfo((prev) => ({
              ...prev,
              address: data.display_name,
            }));
            if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
          } else {
            setDeliveryInfo((prev) => ({
              ...prev,
              address: `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            }));
            if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          setDeliveryInfo((prev) => ({
            ...prev,
            address: `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          }));
          if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert(`Failed to fetch location: ${error.message}`);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
      const items = cartItems.map(item => {
        const itemFoodId = typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
        return {
          foodId: itemFoodId,
          quantity: item.quantity,
          price: item.price,
          isCombination: !!item.isCombination,
          components: item.isCombination ? item.components : undefined,
        };
      });

      const orderData = {
        items,
        customerName: deliveryInfo.fullName,
        deliveryAddress: deliveryInfo.address,
        deliveryLatitude: location.latitude || 0,
        deliveryLongitude: location.longitude || 0,
        paymentMethod: 'mpesa',
        whatsappNumber: deliveryInfo.whatsapp,
        mpesaNumber: deliveryInfo.mpesaNumber,
        deliveryFee: Number(finalDeliveryFee),
        specialInstructions: specialInstructions.trim() || (appliedPromo ? `Promo: ${appliedPromo.code}` : ''),
        restaurantId: selectedRestaurant || undefined,
        promoCode: appliedPromo ? appliedPromo.code : undefined,
        expectedTotal: grandTotal,
      };

      if (user) {
        orderData.userId = user.id || user._id;
      } else {
        orderData.guestEmail = `${deliveryInfo.fullName.replace(/\s+/g, '').toLowerCase()}@delivo-guest.com`;
        orderData.guestPhone = deliveryInfo.whatsapp;
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
        {!user && (
          <div className="info-alert" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#1e3a8a', fontSize: '13px', fontWeight: '500' }}>
            <UserCheck size={18} />
            <span>You are checking out as a <strong>Guest</strong>. You can register later using this phone number to see your order history.</span>
          </div>
        )}

        {errors.submit && (
          <div className="error-alert">
            <AlertCircle size={20} />
            <span>{errors.submit}</span>
          </div>
        )}
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
              <label>WhatsApp Number (For Order Tracking) *</label>
              <input
                type="tel"
                value={deliveryInfo.whatsapp}
                onChange={(e) => {
                  setDeliveryInfo({ ...deliveryInfo, whatsapp: e.target.value });
                  if (errors.whatsapp) setErrors({ ...errors, whatsapp: '' });
                }}
                placeholder="E.g., 0712345678"
                disabled={isProcessing || orderPending}
                className={errors.whatsapp ? 'error' : ''}
              />
              {errors.whatsapp && <span className="field-error">{errors.whatsapp}</span>}
            </div>
          </div>

          <div className="form-section">
            <h4>Delivery Details</h4>
            <div className="form-group">
              <label htmlFor="restaurant-select">Prepare Food At *</label>
              <select
                id="restaurant-select"
                value={selectedRestaurant}
                onChange={(e) => {
                  setSelectedRestaurant(e.target.value);
                  if (errors.restaurant) setErrors({ ...errors, restaurant: '' });
                }}
                disabled={isProcessing || orderPending}
                className={errors.restaurant ? 'error' : ''}
              >
                <option value="">-- Select Restaurant --</option>
                {restaurants.map((restaurant) => (
                  <option 
                    key={restaurant._id || restaurant.id} 
                    value={restaurant._id || restaurant.id}
                    disabled={restaurant.isOpen === false}
                  >
                    {restaurant.name} {restaurant.isOpen === false ? '(CLOSED)' : ''}
                  </option>
                ))}
              </select>
              {errors.restaurant && <span className="field-error">{errors.restaurant}</span>}
              {restaurants.length === 0 && (
                <span className="field-error">No restaurants are currently accepting orders. Please try again later.</span>
              )}
            </div>

            {/* SAVED ADDRESSES SELECTOR */}
            {user && savedAddresses.length > 0 && (
              <div className="form-group">
                <label>Choose a Saved Address</label>
                <select
                  onChange={(e) => {
                    const addr = savedAddresses.find(a => a._id === e.target.value);
                    if (addr) handleSelectSavedAddress(addr);
                  }}
                  disabled={isProcessing || orderPending}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#f9fafb'
                  }}
                >
                  <option value="">-- Use current selected location --</option>
                  {savedAddresses.map((addr) => (
                    <option key={addr._id} value={addr._id}>
                      {addr.label}: {addr.formattedAddress.slice(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Precise Delivery Address / Coordinates *</label>
              <input
                type="text"
                readOnly
                value={deliveryInfo.address}
                placeholder="Click 'Pick on Map' to select your coordinates"
                disabled={isProcessing || orderPending}
                className={errors.address ? 'error' : ''}
                style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
              />
              {errors.address && <span className="field-error">{errors.address}</span>}
              
              <button
                type="button"
                className="location-btn"
                onClick={() => setIsLocationPickerOpen(true)}
                disabled={isProcessing || orderPending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                  background: '#f97316',
                  color: 'white',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '8px',
                  width: '100%',
                  boxShadow: '0 4px 10px rgba(249, 115, 22, 0.2)'
                }}
              >
                <Map size={16} /> Drag Pin & Pick on Map
              </button>
            </div>

            {/* SPECIAL INSTRUCTIONS */}
            <div className="form-group">
              <label>Special Instructions (Optional)</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="E.g., Ring bell twice, drop at reception desk, leave at gate"
                disabled={isProcessing || orderPending}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1.5px solid #d1d5db',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  minHeight: '60px',
                  resize: 'vertical'
                }}
              />
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
                placeholder="Enter M-Pesa phone number"
                disabled={isProcessing || orderPending}
                className={errors.mpesaNumber ? 'error' : ''}
              />
              {errors.mpesaNumber && <span className="field-error">{errors.mpesaNumber}</span>}
            </div>
            <div className="payment-note">
              M-Pesa prompt will be sent to this number.
            </div>

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

        <div className="checkout-summary">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} /> Order Summary
          </h3>
          <div className="summary-items">
            {cartItems.map((item) => {
              const foodId = typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
              return (
                <div key={foodId} className="summary-item" style={{ height: 'auto', padding: '10px 0' }}>
                  <div className="item-info">
                    <span className="item-name" style={{ fontWeight: '700' }}>{item.name}</span>
                    <span className="item-qty">x{item.quantity}</span>
                    {item.isCombination && item.components && (
                      <div className="combo-sub-components" style={{ display: 'flex', flexDirection: 'column', fontSize: '11px', color: '#6b7280', paddingLeft: '8px', borderLeft: '1.5px solid #d1d5db', marginTop: '4px', gap: '2px' }}>
                        {item.components.map((comp, idx) => (
                          <span key={idx}>• {comp.name} ×{comp.quantity}</span>
                        ))}
                      </div>
                    )}
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
            {appliedPromo && (
              <div className="total-row discount" style={{ color: '#22c55e', fontWeight: 600 }}>
                <span>Discount ({appliedPromo.code})</span>
                <span>- KES {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="total-row grand-total">
              <span>Total</span>
              <span className="grand-total-amount">KES {grandTotal}</span>
            </div>
          </div>

          {/* Promo Code Input System */}
          <div className="promo-entry-box" style={{ marginTop: 16, padding: '14px 16px', background: '#f9fafb', borderRadius: 16, border: '1px dashed #e5e7eb' }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Have a Promo / Voucher Code?</label>
            {appliedPromo ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(34, 197, 94, 0.1)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>{appliedPromo.code}</span>
                  <span style={{ fontSize: 12, color: '#166534', marginLeft: 8 }}>Applied successfully!</span>
                </div>
                <button 
                  type="button" 
                  onClick={handleRemovePromo}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Enter code (e.g. SUMMER50)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={promoLoading}
                  style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: 10, fontSize: 14, outline: 'none', background: '#ffffff' }}
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoLoading}
                  style={{ background: '#f97316', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease' }}
                >
                  {promoLoading ? 'Validating...' : 'Apply'}
                </button>
              </div>
            )}
            {promoError && (
              <span style={{ display: 'block', fontSize: 12, color: '#ef4444', marginTop: 6, fontWeight: 600 }}>
                ⚠️ {promoError}
              </span>
            )}
          </div>
        </div>


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
    <>
      <div className={`checkout-modal-overlay ${inline ? 'inline' : ''}`}>
        <div className={`checkout-modal-container ${inline ? 'inline' : ''}`}>
          {renderCheckoutContent()}
        </div>
      </div>
      <LocationPickerModal isOpen={isLocationPickerOpen} onClose={() => setIsLocationPickerOpen(false)} />
    </>
  );
};

export default CheckoutModal;
