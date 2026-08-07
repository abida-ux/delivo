import { useCart } from '../context/CartContext';
import { useCartUI } from '../context/CartUIContext';
import { ShoppingCart } from 'lucide-react';
import './MobileStickyCart.css';

const MobileStickyCart = () => {
  const { getCartItems } = useCart();
  const { openCart } = useCartUI();

  const cartItems = getCartItems();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cartCount === 0) return null;

  return (
    <div className="mobile-sticky-cart-bar" onClick={openCart}>
      <div className="mobile-sticky-cart-content">
        <div className="cart-badge-info">
          <div className="cart-icon-circle">
            <ShoppingCart size={18} />
            <span className="cart-count-badge">{cartCount}</span>
          </div>
          <span className="cart-total-price">KSh {cartTotal.toLocaleString()}</span>
        </div>
        <span className="view-cart-btn-text">View Cart →</span>
      </div>
    </div>
  );
};

export default MobileStickyCart;
