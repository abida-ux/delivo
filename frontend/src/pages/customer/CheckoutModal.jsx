import { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  AlertCircle,
  Check,
  MapPin,
  Map,
  User,
  Phone,
  Store,
  Truck,
  ShieldCheck,
  Clock,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Tag,
  Lock
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import LocationPickerModal from '../../components/LocationPickerModal';
import api, { createOrder, getAppSettings, getMpesaStatus, getOrderById } from '../../services/api';
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
    freeDeliveryMinimum: 2500,
  });

  const { location, updateLocation } = useLocation();
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [landmarkInput, setLandmarkInput] = useState('');

  const [deliveryInfo, setDeliveryInfo] = useState({
    fullName: '',
    address: '',
    whatsapp: '',
    mpesaNumber: ''
  });

  const [orderId, setOrderId] = useState(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [finalOrderTotal, setFinalOrderTotal] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentStage, setPaymentStage] = useState('idle'); // 'idle' | 'pending' | 'success' | 'failed'
  const [orderPending, setOrderPending] = useState(false);
  const pollInterval = useRef(null);
  
  // Promo code / voucher states
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // Sync landmark input and formatted address from LocationContext
  useEffect(() => {
    if (location.nearbyLandmark) {
      setLandmarkInput(location.nearbyLandmark);
    }
    if (location.formattedAddress) {
      setDeliveryInfo(prev => ({
        ...prev,
        address: location.formattedAddress,
      }));
    }
  }, [location.formattedAddress, location.nearbyLandmark]);

  // Load saved addresses for logged-in user
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
            setLandmarkInput(def.landmark || '');
            updateLocation(def.latitude, def.longitude, def.formattedAddress, def.landmark);
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
    setLandmarkInput(addressItem.landmark || '');
    updateLocation(addressItem.latitude, addressItem.longitude, addressItem.formattedAddress, addressItem.landmark);
  };

  // Load App Delivery Settings & Profile defaults
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
      setPaymentStage('idle');
      setOrderPending(false);
      setErrors({});
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

  // Group items by restaurant for clean read-only review
  const { restaurantGroups, uniqueRestaurantCount } = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      const restId = item.restaurantId
        ? (typeof item.restaurantId === 'object' ? item.restaurantId._id : item.restaurantId).toString()
        : 'general';
      const restName = item.restaurantName || (item.productType === 'marketplace' ? 'Campus Mart' : 'Delivo Kitchen');

      if (!map[restId]) {
        map[restId] = {
          restaurantId: restId,
          restaurantName: restName,
          items: [],
          subtotal: 0,
        };
      }
      map[restId].items.push(item);
      map[restId].subtotal += (Number(item.price) || 0) * (Number(item.quantity) || 1);
    });

    const groups = Object.values(map);
    const count = groups.filter(g => g.restaurantId !== 'general').length || 1;
    return { restaurantGroups: groups, uniqueRestaurantCount: count };
  }, [cartItems]);

  const baseDeliveryFee = cartItems.length > 0 && deliverySettings.enabled ? deliverySettings.amount : 0;
  const isFreeDeliveryEligible = deliverySettings.freeDeliveryEnabled && cartTotal >= deliverySettings.freeDeliveryMinimum;
  const calculatedDeliveryFee = isFreeDeliveryEligible ? 0 : uniqueRestaurantCount * baseDeliveryFee;
  
  // Calculate discount based on applied promo
  let discountAmount = 0;
  let finalDeliveryFee = calculatedDeliveryFee;
  
  if (appliedPromo) {
    const discountStr = appliedPromo.discount.toUpperCase();
    if (discountStr.includes('FREE DELIVERY')) {
      finalDeliveryFee = 0;
      discountAmount = calculatedDeliveryFee;
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
        setPromoError('Invalid or expired promo code');
        setAppliedPromo(null);
      } else {
        let minOrderVal = 0;
        if (match.minOrder) {
          minOrderVal = parseFloat(match.minOrder.replace(/[^0-9.]/g, '')) || 0;
        }
        if (parseFloat(cartTotal) < minOrderVal) {
          setPromoError(`Minimum order of KES ${minOrderVal} required for this promo`);
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

    if (!deliveryInfo.fullName.trim()) {
      newErrors.fullName = 'Please enter your full name';
    }

    if (!location.latitude || !location.longitude) {
      newErrors.address = 'Please pin your exact delivery location on the map';
    } else if (!landmarkInput.trim() || landmarkInput.trim().length < 2) {
      newErrors.landmark = 'Please enter your hostel name, house, or room number';
    } else if (!deliveryInfo.address.trim()) {
      newErrors.address = 'Precise delivery address is required';
    }

    if (!deliveryInfo.whatsapp.trim()) {
      newErrors.whatsapp = 'Please enter your WhatsApp phone number';
    } else {
      const normalizedWhatsApp = deliveryInfo.whatsapp.replace(/[^0-9+]/g, '');
      if (!phonePattern.test(normalizedWhatsApp)) {
        newErrors.whatsapp = 'Enter a valid Kenyan number (e.g., 0712 345 678)';
      }
    }

    if (!deliveryInfo.mpesaNumber.trim()) {
      newErrors.mpesaNumber = 'Please enter your M-Pesa phone number';
    } else {
      const normalizedMpesaNumber = deliveryInfo.mpesaNumber.replace(/[^0-9+]/g, '');
      if (!phonePattern.test(normalizedMpesaNumber)) {
        newErrors.mpesaNumber = 'Enter a valid Kenyan M-Pesa number (e.g., 0712 345 678)';
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

  const checkOrderStatus = async (id, checkoutRequestIdValue) => {
    try {
      let updatedOrder = null;
      if (checkoutRequestIdValue) {
        try {
          updatedOrder = await getMpesaStatus(checkoutRequestIdValue);
        } catch (e) {
          console.warn('getMpesaStatus poll error:', e);
        }
      }
      if (!updatedOrder && id) {
        try {
          updatedOrder = await getOrderById(id);
        } catch (e) {
          console.warn('getOrderById poll error:', e);
        }
      }

      if (!updatedOrder) return;

      const currentStatus = updatedOrder.paymentStatus || updatedOrder.status;
      setPaymentStatus(currentStatus);

      if (currentStatus === 'completed' || currentStatus === 'confirmed') {
        clearPolling();
        const confirmedAmount = updatedOrder.totalPrice ?? updatedOrder.amount ?? finalOrderTotal ?? grandTotal;
        setFinalOrderTotal(Number(confirmedAmount).toFixed(2));
        setPaymentStage('success');
        setPaymentMessage('Payment confirmed! Your order has been placed successfully.');
        if (!user) {
          saveGuestOrder(updatedOrder);
        }
        clearCart();
        if (onOrderSuccess) onOrderSuccess(updatedOrder);
        return;
      }

      if (currentStatus === 'failed' || currentStatus === 'cancelled') {
        clearPolling();
        setPaymentStage('failed');
        setPaymentMessage(updatedOrder.failureReason || 'Payment was not completed. You were not charged.');
        return;
      }

      setPaymentStage('pending');
      setPaymentMessage('Payment request sent. Please check your phone and enter your M-Pesa PIN...');
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
    setPaymentMessage('Payment prompt sent! Waiting for your M-Pesa PIN confirmation...');
    await checkOrderStatus(id, checkoutRequestIdValue);
    pollInterval.current = setInterval(() => {
      checkOrderStatus(id, checkoutRequestIdValue);
    }, 1200);
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    try {
      // Sync landmark into context
      if (location.latitude && location.longitude) {
        updateLocation(location.latitude, location.longitude, deliveryInfo.address, landmarkInput.trim());
      }

      const fullDeliveryAddress = landmarkInput.trim()
        ? `${deliveryInfo.address} [${landmarkInput.trim()}]`
        : deliveryInfo.address;

      const items = cartItems.map(item => {
        const itemFoodId = typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
        const marketplaceProductId = typeof item.marketplaceProductId === 'object' ? item.marketplaceProductId._id : item.marketplaceProductId;
        const rId = typeof item.restaurantId === 'object' ? item.restaurantId._id : item.restaurantId;

        return {
          productType: item.productType === 'marketplace' ? 'marketplace' : 'meal',
          foodId: item.productType === 'marketplace' ? undefined : itemFoodId,
          marketplaceProductId: item.productType === 'marketplace' ? marketplaceProductId : undefined,
          restaurantId: rId || undefined,
          restaurantName: item.restaurantName || undefined,
          quantity: item.quantity,
          price: item.price,
          categoryType: item.categoryType || (item.productType === 'marketplace' ? 'marketplace' : 'meal'),
          isCombination: !!item.isCombination,
          components: item.isCombination ? item.components : undefined,
        };
      });

      const orderData = {
        items,
        customerName: deliveryInfo.fullName,
        deliveryAddress: fullDeliveryAddress,
        deliveryLatitude: location.latitude || 0,
        deliveryLongitude: location.longitude || 0,
        paymentMethod: 'mpesa',
        whatsappNumber: deliveryInfo.whatsapp,
        mpesaNumber: deliveryInfo.mpesaNumber,
        deliveryFee: Number(finalDeliveryFee),
        specialInstructions: specialInstructions.trim() || (appliedPromo ? `Promo: ${appliedPromo.code}` : ''),
        promoCode: appliedPromo ? appliedPromo.code : undefined,
        expectedTotal: grandTotal,
      };

      if (user) {
        orderData.userId = user.id || user._id;
      } else {
        orderData.guestEmail = `${deliveryInfo.fullName.replace(/\s+/g, '').toLowerCase()}@delivo-guest.com`;
        orderData.guestPhone = deliveryInfo.whatsapp;
      }

      console.log('🛒 Submitting order to /api/orders:', orderData);

      setFinalOrderTotal(grandTotal);
      const response = await createOrder(orderData);
      if (response?.totalPrice || response?.amount) {
        setFinalOrderTotal(Number(response.totalPrice || response.amount).toFixed(2));
      }

      console.log('✅ Order placed successfully:', response);
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

  const hasPinnedCoordinates = Boolean(location.latitude && location.longitude);

  return (
    <>
      <div className={`chk-overlay ${inline ? 'is-inline' : ''}`} onClick={paymentStage === 'idle' ? onClose : undefined}>
        <div className="chk-container" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="chk-header">
            <div className="chk-header-left">
              <div className="chk-brand-badge">DELIVO</div>
              <div>
                <h2 className="chk-title">Complete your order</h2>
                <p className="chk-subtitle">Almost there — confirm your details and pay securely.</p>
              </div>
            </div>
            {paymentStage === 'idle' && (
              <button className="chk-close-btn" onClick={onClose} title="Close checkout">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Minimal Disciplined Progress Indicator */}
          <div className="chk-progress-bar">
            <div className={`chk-step ${paymentStage === 'idle' ? 'is-active' : 'is-done'}`}>
              <span className="chk-step-num">01</span>
              <span className="chk-step-name">Delivery</span>
            </div>
            <div className="chk-step-divider"></div>
            <div className={`chk-step ${paymentStage === 'idle' ? 'is-active' : 'is-done'}`}>
              <span className="chk-step-num">02</span>
              <span className="chk-step-name">Review</span>
            </div>
            <div className="chk-step-divider"></div>
            <div className={`chk-step ${paymentStage !== 'idle' ? 'is-active' : ''}`}>
              <span className="chk-step-num">03</span>
              <span className="chk-step-name">Payment</span>
            </div>
          </div>

          {/* PENDING STK PUSH STATE */}
          {paymentStage === 'pending' && (
            <div className="chk-state-view pending">
              <div className="chk-pulse-icon-wrap">
                <Phone size={32} />
              </div>
              <h3 className="chk-state-title">Check your phone</h3>
              <p className="chk-state-desc">
                We sent an M-Pesa prompt for <strong>KES {finalOrderTotal || grandTotal}</strong> to{' '}
                <strong>{deliveryInfo.mpesaNumber}</strong>.
              </p>
              <div className="chk-pin-prompt-box">
                <Clock size={15} />
                <span>Please enter your M-Pesa PIN on your phone to complete payment.</span>
              </div>
              <div className="chk-spinner-row">
                <div className="chk-spinner"></div>
                <span>Waiting for confirmation...</span>
              </div>
              <p className="chk-help-text">
                Did not receive the prompt? Please keep your screen unlocked and ensure your SIM has active network.
              </p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {paymentStage === 'success' && (
            <div className="chk-state-view success">
              <div className="chk-success-icon-wrap">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="chk-state-title">Payment successful!</h3>
              <p className="chk-state-desc">
                <strong>KES {finalOrderTotal || grandTotal}</strong> has been received via M-Pesa. Your order has been dispatched to the kitchens.
              </p>
              {orderId && (
                <div className="chk-order-id-chip">
                  Order ID: <strong>#{orderId.slice(-6).toUpperCase()}</strong>
                </div>
              )}
              <div className="chk-success-actions">
                <button
                  type="button"
                  className="chk-pri-btn"
                  onClick={() => {
                    onClose?.();
                    navigate('/customer/orders');
                  }}
                >
                  Track Order <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  className="chk-sec-btn"
                  onClick={() => {
                    onClose?.();
                    navigate('/menu');
                  }}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

          {/* FAILURE STATE */}
          {paymentStage === 'failed' && (
            <div className="chk-state-view failed">
              <div className="chk-failed-icon-wrap">
                <XCircle size={40} />
              </div>
              <h3 className="chk-state-title">Payment wasn't completed</h3>
              <p className="chk-state-desc">
                {paymentMessage || 'The payment request was cancelled or timed out. You have not been charged.'}
              </p>
              <div className="chk-failure-actions">
                <button
                  type="button"
                  className="chk-pri-btn"
                  onClick={() => {
                    setPaymentStage('idle');
                    setErrors({});
                  }}
                >
                  <RefreshCw size={16} /> Try Again
                </button>
                <button
                  type="button"
                  className="chk-sec-btn"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* MAIN CHECKOUT FORM & REVIEW (IDLE STATE) */}
          {paymentStage === 'idle' && (
            <div className="chk-body-grid">
              {/* LEFT / MAIN COLUMN (62%) */}
              <div className="chk-main-col">
                {/* Subtle Neutral Guest Banner */}
                {!user && (
                  <div className="chk-guest-panel">
                    <User size={15} className="chk-guest-icon" />
                    <div className="chk-guest-text">
                      <span>Checking out as a <strong>guest</strong>. You can create an account later using this phone number to track orders.</span>
                    </div>
                  </div>
                )}

                {/* Submit Error Notice */}
                {errors.submit && (
                  <div className="chk-error-banner">
                    <AlertCircle size={16} />
                    <span>{errors.submit}</span>
                  </div>
                )}

                {/* Section 1: Customer Details */}
                <section className="chk-section">
                  <h3 className="chk-section-title">Delivery details</h3>

                  <div className="chk-fields-grid">
                    <div className="chk-field-group">
                      <label htmlFor="chk-full-name">Full name</label>
                      <input
                        id="chk-full-name"
                        type="text"
                        value={deliveryInfo.fullName}
                        onChange={(e) => {
                          setDeliveryInfo({ ...deliveryInfo, fullName: e.target.value });
                          if (errors.fullName) setErrors({ ...errors, fullName: '' });
                        }}
                        placeholder="e.g. Abeda Nyakundi"
                        disabled={isProcessing}
                        className={errors.fullName ? 'has-error' : ''}
                      />
                      {errors.fullName && <span className="chk-field-error">{errors.fullName}</span>}
                    </div>

                    <div className="chk-field-group">
                      <label htmlFor="chk-whatsapp">WhatsApp number</label>
                      <input
                        id="chk-whatsapp"
                        type="tel"
                        value={deliveryInfo.whatsapp}
                        onChange={(e) => {
                          setDeliveryInfo({
                            ...deliveryInfo,
                            whatsapp: e.target.value,
                            mpesaNumber: deliveryInfo.mpesaNumber || e.target.value
                          });
                          if (errors.whatsapp) setErrors({ ...errors, whatsapp: '' });
                        }}
                        placeholder="e.g. 0712 345 678"
                        disabled={isProcessing}
                        className={errors.whatsapp ? 'has-error' : ''}
                      />
                      {errors.whatsapp && <span className="chk-field-error">{errors.whatsapp}</span>}
                    </div>
                  </div>
                </section>

                {/* Section 2: Delivery Location */}
                <section className="chk-section">
                  <h3 className="chk-section-title">Delivery location</h3>

                  {/* Saved Address Dropdown (Logged in only) */}
                  {user && savedAddresses.length > 0 && (
                    <div className="chk-saved-addresses-row">
                      <label>Use a saved address:</label>
                      <select
                        onChange={(e) => {
                          const addr = savedAddresses.find(a => a._id === e.target.value);
                          if (addr) handleSelectSavedAddress(addr);
                        }}
                        disabled={isProcessing}
                      >
                        <option value="">-- Select saved address --</option>
                        {savedAddresses.map((addr) => (
                          <option key={addr._id} value={addr._id}>
                            {addr.label}: {addr.formattedAddress.slice(0, 45)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Address Display & Map Action */}
                  <div className={`chk-location-card ${hasPinnedCoordinates ? 'is-pinned' : 'needs-pin'}`}>
                    <div className="chk-location-card-main">
                      <div className="chk-loc-badge-row">
                        {hasPinnedCoordinates ? (
                          <span className="chk-loc-status pinned">
                            <Check size={13} /> Exact location pinned
                          </span>
                        ) : (
                          <span className="chk-loc-status unpinned">
                            <AlertCircle size={13} /> Pin your exact delivery location
                          </span>
                        )}
                      </div>
                      <p className="chk-address-text">
                        {deliveryInfo.address || 'No location selected yet. Tap adjust on map.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="chk-map-btn"
                      onClick={() => setIsLocationPickerOpen(true)}
                      disabled={isProcessing}
                    >
                      <Map size={14} />
                      <span>{hasPinnedCoordinates ? 'Adjust on map' : 'Pin location on map'}</span>
                    </button>
                  </div>
                  {errors.address && <span className="chk-field-error">{errors.address}</span>}

                  {/* Landmark / Building info */}
                  <div className="chk-field-group" style={{ marginTop: '12px' }}>
                    <label htmlFor="chk-landmark">Landmark / Building directions</label>
                    <input
                      id="chk-landmark"
                      type="text"
                      value={landmarkInput}
                      onChange={(e) => {
                        setLandmarkInput(e.target.value);
                        if (errors.landmark) setErrors({ ...errors, landmark: '' });
                      }}
                      placeholder="e.g. Nile 32 B, near the main gate"
                      disabled={isProcessing}
                      className={errors.landmark ? 'has-error' : ''}
                    />
                    {errors.landmark && <span className="chk-field-error">{errors.landmark}</span>}
                  </div>

                  {/* Special delivery instructions */}
                  <div className="chk-field-group" style={{ marginTop: '10px' }}>
                    <label htmlFor="chk-instructions">
                      Delivery instructions <span className="chk-opt-tag">Optional</span>
                    </label>
                    <textarea
                      id="chk-instructions"
                      rows={2}
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Ring twice, leave at reception, call when at gate..."
                      disabled={isProcessing}
                    />
                  </div>
                </section>

                {/* Section 3: M-Pesa Payment */}
                <section className="chk-section">
                  <h3 className="chk-section-title">Payment</h3>

                  <div className="chk-payment-card">
                    <div className="chk-payment-top">
                      <div className="chk-payment-method-name">
                        <strong>M-Pesa</strong>
                        <span className="chk-payment-method-sub">Pay securely via STK Push</span>
                      </div>
                      <div className="chk-payment-security">
                        <Lock size={12} />
                        <span>Secure payment</span>
                      </div>
                    </div>

                    <div className="chk-field-group" style={{ marginTop: '12px' }}>
                      <label htmlFor="chk-mpesa-phone">M-Pesa phone number</label>
                      <input
                        id="chk-mpesa-phone"
                        type="tel"
                        value={deliveryInfo.mpesaNumber}
                        onChange={(e) => {
                          setDeliveryInfo({ ...deliveryInfo, mpesaNumber: e.target.value });
                          if (errors.mpesaNumber) setErrors({ ...errors, mpesaNumber: '' });
                        }}
                        placeholder="e.g. 0712 345 678"
                        disabled={isProcessing}
                        className={errors.mpesaNumber ? 'has-error' : ''}
                      />
                      {errors.mpesaNumber && <span className="chk-field-error">{errors.mpesaNumber}</span>}
                    </div>

                    <p className="chk-mpesa-instruction">
                      An STK push will be sent to this number. Enter your M-Pesa PIN on your phone to complete your order.
                    </p>
                  </div>

                  {/* Order Confidence Recap */}
                  {deliveryInfo.address && hasPinnedCoordinates && (
                    <div className="chk-confidence-box">
                      <div className="chk-confidence-line">
                        <MapPin size={13} />
                        <span>
                          Delivering to: <strong>{deliveryInfo.address}</strong>
                          {landmarkInput ? ` (${landmarkInput})` : ''}
                        </span>
                      </div>
                      {deliveryInfo.mpesaNumber && (
                        <div className="chk-confidence-line">
                          <Phone size={13} />
                          <span>
                            Paying via M-Pesa: <strong>{deliveryInfo.mpesaNumber}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Desktop Action Button */}
                  <div className="chk-desktop-action">
                    <button
                      type="button"
                      className="chk-pay-button"
                      onClick={handlePlaceOrder}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <div className="chk-btn-spinner"></div>
                          <span>Sending M-Pesa request...</span>
                        </>
                      ) : (
                        <>
                          <span>Pay KES {grandTotal} via M-Pesa</span>
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                  </div>
                </section>
              </div>

              {/* RIGHT / SUMMARY COLUMN (38%) */}
              <div className="chk-summary-col">
                <div className="chk-summary-card">
                  <div className="chk-summary-card-header">
                    <h3 className="chk-summary-title">Your order</h3>
                    <span className="chk-summary-items-count">
                      {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Read-Only Items Grouped by Supplying Restaurant */}
                  <div className="chk-groups-list">
                    {restaurantGroups.map((group) => (
                      <div key={group.restaurantId} className="chk-rest-group">
                        <div className="chk-group-header">
                          <Store size={13} className="chk-store-icon" />
                          <span className="chk-group-name">{group.restaurantName}</span>
                        </div>

                        <div className="chk-group-items">
                          {group.items.map((item) => {
                            const itemId = typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
                            const price = Number(item.price) || 0;
                            const lineTotal = price * (item.quantity || 1);

                            return (
                              <div key={itemId} className="chk-summary-item-row">
                                <div className="chk-item-main-info">
                                  <div className="chk-item-name-qty">
                                    <span className="chk-item-title">{item.name}</span>
                                    <span className="chk-item-qty-tag">× {item.quantity}</span>
                                  </div>
                                  {item.isCombination && item.components && (
                                    <div className="chk-combo-chips">
                                      {item.components.map((c, i) => (
                                        <span key={i}>• {c.name} ×{c.quantity}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span className="chk-item-price-tag">KES {lineTotal.toLocaleString()}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cost Breakdown */}
                  <div className="chk-cost-breakdown">
                    <div className="chk-cost-line">
                      <span>Food subtotal</span>
                      <strong>KES {Number(cartTotal).toLocaleString()}</strong>
                    </div>

                    <div className="chk-cost-line">
                      <div className="chk-fee-label-wrap">
                        <span>Delivery</span>
                        {uniqueRestaurantCount > 1 && (
                          <span className="chk-multi-pickup-tag">({uniqueRestaurantCount} restaurant pickups)</span>
                        )}
                      </div>
                      <strong>
                        {finalDeliveryFee === 0 ? (
                          <span className="chk-free-tag">FREE</span>
                        ) : (
                          `KES ${Number(finalDeliveryFee).toLocaleString()}`
                        )}
                      </strong>
                    </div>

                    {appliedPromo && (
                      <div className="chk-cost-line discount">
                        <span>Discount ({appliedPromo.code})</span>
                        <strong>- KES {Number(discountAmount).toFixed(2)}</strong>
                      </div>
                    )}

                    <div className="chk-cost-divider"></div>

                    <div className="chk-cost-line total-line">
                      <span>Total</span>
                      <strong className="chk-grand-total">KES {grandTotal}</strong>
                    </div>
                  </div>

                  {/* Compact Promo Code Box */}
                  <div className="chk-promo-widget">
                    <div className="chk-promo-widget-header">
                      <Tag size={12} />
                      <span>Have a promo code?</span>
                    </div>

                    {appliedPromo ? (
                      <div className="chk-promo-applied-chip">
                        <div className="chk-promo-applied-text">
                          <Check size={12} />
                          <span>{appliedPromo.code} applied</span>
                          <span className="chk-promo-savings">Saved KES {Number(discountAmount).toFixed(0)}</span>
                        </div>
                        <button type="button" className="chk-promo-remove-btn" onClick={handleRemovePromo}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="chk-promo-input-row">
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          disabled={promoLoading || isProcessing}
                        />
                        <button
                          type="button"
                          className="chk-promo-apply-btn"
                          onClick={handleApplyPromo}
                          disabled={promoLoading || isProcessing}
                        >
                          {promoLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                    )}
                    {promoError && <span className="chk-promo-error">{promoError}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MOBILE STICKY BOTTOM PAYMENT BAR (Visible on mobile screens) */}
          {paymentStage === 'idle' && (
            <div className="chk-mobile-bar">
              <div className="chk-mobile-total-block">
                <span className="chk-mobile-label">Total</span>
                <strong className="chk-mobile-val">KES {grandTotal}</strong>
              </div>
              <button
                type="button"
                className="chk-mobile-pay-btn"
                onClick={handlePlaceOrder}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Pay KES ${grandTotal} via M-Pesa`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Existing Location Map Modal */}
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onLocationSelect={(selectedLoc) => {
          updateLocation(
            selectedLoc.latitude,
            selectedLoc.longitude,
            selectedLoc.formattedAddress,
            selectedLoc.nearbyLandmark || landmarkInput
          );
          if (selectedLoc.nearbyLandmark) {
            setLandmarkInput(selectedLoc.nearbyLandmark);
          }
          if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
        }}
      />
    </>
  );
};

export default CheckoutModal;
