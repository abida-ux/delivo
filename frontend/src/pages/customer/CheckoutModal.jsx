import React, { useState, useContext, useEffect, useRef } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { createOrder, getAppSettings, getOrderById } from '../../services/api';
import './CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose, cartItems, cartTotal, onOrderSuccess }) => {
  const { user } = useContext(AuthContext);
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [deliverySettings, setDeliverySettings] = useState({ enabled: true, amount: 20 });
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    email: '',
    phone: '',
    whatsapp: '',
    mpesaNumber: '',
    notes: ''
  });
  const [orderId, setOrderId] = useState(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [orderPending, setOrderPending] = useState(false);
  const pollInterval = useRef(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getAppSettings();
        setDeliverySettings({
          enabled: settings.deliveryFeeEnabled !== false,
          amount: settings.deliveryFeeAmount != null ? Number(settings.deliveryFeeAmount) : 20,
        });
      } catch (error) {
        console.error('Error loading app settings:', error);
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const deliveryFee = cartItems.length > 0 && deliverySettings.enabled ? deliverySettings.amount : 0;
  const tax = (cartTotal * 0.1).toFixed(2);
  const grandTotal = (parseFloat(cartTotal) + deliveryFee + parseFloat(tax)).toFixed(2);

  const validateForm = () => {
    const newErrors = {};
    
    if (!deliveryInfo.address.trim()) {
      newErrors.address = 'Delivery address is required';
    }
    if (!deliveryInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9\s\-+]{7,}$/.test(deliveryInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!deliveryInfo.whatsapp.trim()) {
      newErrors.whatsapp = 'WhatsApp number is required';
    } else if (!/^07[0-9]{8}$/.test(deliveryInfo.whatsapp.replace(/\s+/g, '')) && !/^\+2547[0-9]{8}$/.test(deliveryInfo.whatsapp.replace(/\s+/g, '')) ) {
      newErrors.whatsapp = 'Please enter a valid Kenyan WhatsApp number';
    }
    if (!deliveryInfo.mpesaNumber.trim()) {
      newErrors.mpesaNumber = 'M-Pesa number is required';
    } else if (!/^07[0-9]{8}$/.test(deliveryInfo.mpesaNumber.replace(/\s+/g, '')) && !/^\+2547[0-9]{8}$/.test(deliveryInfo.mpesaNumber.replace(/\s+/g, '')) ) {
      newErrors.mpesaNumber = 'Please enter a valid Kenyan M-Pesa number';
    }
    // ✅ For guest users, email is required
    if (!user && !deliveryInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (deliveryInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deliveryInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
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
    return () => {
      clearPolling();
    };
  }, []);

  const checkOrderStatus = async (id) => {
    try {
      const updatedOrder = await getOrderById(id);
      setPaymentStatus(updatedOrder.paymentStatus);

      if (updatedOrder.paymentStatus === 'completed') {
        clearPolling();
        setPaymentMessage('Payment confirmed. Thank you! Redirecting to your orders...');
        setOrderPending(false);
        clearCart();
        onOrderSuccess(updatedOrder);
        return;
      }

      if (updatedOrder.paymentStatus === 'failed') {
        clearPolling();
        setPaymentMessage('Payment failed. Please retry the M-Pesa prompt or close this window.');
        setOrderPending(false);
        return;
      }

      setPaymentMessage('M-Pesa prompt sent. Waiting for payment confirmation...');
    } catch (error) {
      console.error('Error polling order status:', error);
      setPaymentMessage('Waiting for payment confirmation... Please keep this screen open.');
    }
  };

  const startPaymentPolling = async (id) => {
    if (pollInterval.current) {
      clearPolling();
    }

    setOrderPending(true);
    setPaymentMessage('M-Pesa prompt sent. Waiting for payment confirmation...');
    await checkOrderStatus(id);
    pollInterval.current = setInterval(() => {
      checkOrderStatus(id);
    }, 5000);
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
        deliveryAddress: deliveryInfo.address,
        paymentMethod: 'mpesa',
        whatsappNumber: deliveryInfo.whatsapp,
        mpesaNumber: deliveryInfo.mpesaNumber,
        deliveryFee,
        tax: Number(tax),
        specialInstructions: deliveryInfo.notes,
      };

      if (user && user.id) {
        orderData.userId = user.id;
        orderData.guestPhone = deliveryInfo.phone;
      } else {
        orderData.guestEmail = deliveryInfo.email || 'guest@delivo.com';
        orderData.guestPhone = deliveryInfo.phone;
      }

      console.log('🛒 Creating order with data:', orderData);

      const response = await createOrder(orderData);

      console.log('✅ Order created successfully:', response);
      setOrderId(response._id);
      setCheckoutRequestId(response.checkoutRequestId);
      setPaymentStatus(response.paymentStatus);
      setErrors({});
      startPaymentPolling(response._id);
    } catch (error) {
      console.error('❌ Error creating order:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to place order';
      setErrors({ submit: errorMsg });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="checkout-modal-overlay">
      <div className="checkout-modal-container">
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
              <div className="total-row">
                <span>Tax (10%)</span>
                <span>KES {tax}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total</span>
                <span className="grand-total-amount">KES {grandTotal}</span>
              </div>
            </div>
          </div>

          <form className="checkout-form" onSubmit={(e) => { e.preventDefault(); handlePlaceOrder(); }}>
            <div className="form-section">
              <h4>Delivery Address</h4>
              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  value={deliveryInfo.address}
                  onChange={(e) => {
                    setDeliveryInfo({ ...deliveryInfo, address: e.target.value });
                    if (errors.address) setErrors({ ...errors, address: '' });
                  }}
                  placeholder="Street address, building name, or campus landmark"
                  disabled={isProcessing || orderPending}
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <span className="field-error">{errors.address}</span>}
              </div>
            </div>

            <div className="form-section">
              <h4>Contact Information</h4>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={deliveryInfo.phone}
                  onChange={(e) => {
                    setDeliveryInfo({ ...deliveryInfo, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  placeholder="0722 000 000"
                  disabled={isProcessing || orderPending}
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>

              {!user && (
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={deliveryInfo.email}
                    onChange={(e) => {
                      setDeliveryInfo({ ...deliveryInfo, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="name@example.com"
                    disabled={isProcessing || orderPending}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
              )}
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
                We will send an M-Pesa STK push to this number. Your order stays pending until payment is confirmed.
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

            <div className="form-section">
              <h4>Special Instructions (Optional)</h4>
              <textarea
                value={deliveryInfo.notes}
                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, notes: e.target.value })}
                placeholder="Add allergies, preferences, or delivery instructions..."
                rows="3"
                disabled={isProcessing}
                maxLength="200"
              />
              <span className="char-count">{deliveryInfo.notes.length}/200</span>
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

          {paymentMessage && (
            <div className="payment-status-box">
              <div className="payment-status-title">Payment Status</div>
              <p>{paymentMessage}</p>
              {checkoutRequestId && (
                <p className="payment-subtext">Checkout Request ID: {checkoutRequestId}</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
