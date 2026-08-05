import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useMarketplaceCart } from '../../contexts/marketplace/MarketplaceCartContext';
import { resolveImageUrl } from '../../utils/placeholderImage';

export default function MarketplaceCartDrawer() {
  const navigate = useNavigate();
  const {
    cartItems,
    isCartOpen,
    closeMarketplaceCart,
    updateQuantity,
    removeItem,
    cartTotal,
  } = useMarketplaceCart();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    closeMarketplaceCart();
    navigate('/marketplace/checkout');
  };

  return (
    <div className="cart-modal-overlay" onClick={closeMarketplaceCart}>
      <div className="cart-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="cart-modal-header">
          <h2>Marketplace Cart ({cartItems.length})</h2>
          <button className="cart-modal-close" onClick={closeMarketplaceCart}>
            <X size={18} />
          </button>
        </div>

        <div className="cart-modal-content">
          {cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <ShoppingBag />
              <h3>Your Marketplace cart is empty</h3>
              <p>Discover products, electronics & groceries across local merchants.</p>
              <button
                className="start-shopping-btn"
                onClick={closeMarketplaceCart}
              >
                Explore Marketplace
              </button>
            </div>
          ) : (
            <div className="cart-modal-items">
              {cartItems.map((item) => {
                const itemId = item._id || item.id;
                const price = Number(item.finalPrice || item.price) || 0;
                return (
                  <div key={itemId} className="cart-item">
                    <img
                      src={resolveImageUrl(item.image || item.images?.[0])}
                      alt={item.name}
                      style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }}
                    />
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <p>KES {price.toFixed(2)}</p>
                    </div>

                    <div className="cart-item-quantity">
                      <button className="qty-btn" onClick={() => updateQuantity(itemId, item.quantity - 1)}>
                        <Minus size={12} />
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(itemId, item.quantity + 1)}>
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      className="cart-remove-btn"
                      onClick={() => removeItem(itemId)}
                      title="Remove product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-modal-footer">
            <div className="summary-row total">
              <span>Total</span>
              <span className="total-price">KES {cartTotal.toFixed(2)}</span>
            </div>
            <button className="checkout-btn" onClick={handleCheckout}>
              Proceed to Marketplace Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
