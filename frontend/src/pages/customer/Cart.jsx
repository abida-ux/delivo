import React, { useState, useContext } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import CheckoutModal from './CheckoutModal';
import '../pages.css';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { removeItem, updateQuantity, getCartItems, getCartTotal, clearCart } = useCart();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState(null);

  const cartItems = getCartItems();
  
  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity > 0) {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    console.log('🛒 Checkout clicked');
    console.log('   cartItems:', cartItems.length);
    console.log('   user:', user);
    
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    if (!user) {
      console.log('❌ No user - checking localStorage');
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        alert('Please log in to place an order');
        navigate('/');
        return;
      }
    }
    
    console.log('✅ Opening checkout modal');
    setShowCheckoutModal(true);
  };

  const handleOrderSuccess = (orderData) => {
    console.log('✅ Order placed successfully:', orderData);
    setOrderConfirmation(orderData);
    
    // Show confirmation for 3 seconds then redirect
    setTimeout(() => {
      navigate('/customer/orders');
    }, 3000);
  };

  const cartTotal = getCartTotal();
  const deliveryFee = cartItems.length > 0 ? 5 : 0;
  const tax = (cartTotal * 0.1).toFixed(2);
  const grandTotal = (parseFloat(cartTotal) + deliveryFee + parseFloat(tax)).toFixed(2);

  return (
    <div className="cart-container">
      {/* Order Confirmation Toast */}
      {orderConfirmation && (
        <div className="confirmation-toast">
          <div className="toast-icon">✓</div>
          <div className="toast-content">
            <h3>Order Confirmed!</h3>
            <p>Order ID: {orderConfirmation._id.slice(-8).toUpperCase()}</p>
            <p className="toast-redirect">Redirecting to orders...</p>
          </div>
        </div>
      )}

      <div className="cart-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="cart-title">Shopping Cart</h1>
        <div style={{ width: '24px' }}></div>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <ShoppingCart size={48} />
          <h2>Your cart is empty</h2>
          <p>Add delicious items from restaurants to get started</p>
          <button className="cta-button" onClick={() => navigate('/')}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items-section">
            <h2 className="section-title">Order Items ({cartItems.length})</h2>
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={item.foodId._id || item.foodId} className="cart-item">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="item-image" />
                  )}
                  <div className="item-details">
                    <h3 className="item-name">{item.name}</h3>
                    {item.restaurant && (
                      <p className="item-restaurant">{item.restaurant}</p>
                    )}
                    <p className="item-price">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="item-controls">
                    <button
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item.foodId._id || item.foodId, item.quantity - 1)}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="qty-display">{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => handleQuantityChange(item.foodId._id || item.foodId, item.quantity + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="item-total">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => removeItem(item.foodId._id || item.foodId)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-summary-section">
            <h2 className="section-title">Order Summary</h2>
            <div className="summary-box">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Tax (10%)</span>
                <span>${tax}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${grandTotal}</span>
              </div>
            </div>

            <button className="checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
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
