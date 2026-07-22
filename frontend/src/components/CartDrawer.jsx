import { ShoppingCart, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCartUI } from '../context/CartUIContext';

const CartDrawer = () => {
  const { getCartItems, removeItem, updateQuantity } = useCart();
  const { isCartOpen, closeCart, openCheckout } = useCartUI();
  const navigate = useNavigate();

  const cartItems = getCartItems();

  if (!isCartOpen) return null;

  return (
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
  );
};

export default CartDrawer;
