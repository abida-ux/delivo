import { useState } from 'react';
import { ShoppingCart, X, Trash2, ChevronDown, Store, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCartUI } from '../context/CartUIContext';
import RestaurantPickerModal from './RestaurantPickerModal';

const CartDrawer = () => {
  const {
    getCartItems,
    removeItem,
    updateQuantity,
    updateItemRestaurant,
    getCartTotal,
    hasUnassignedItems,
  } = useCart();
  const { isCartOpen, closeCart, openCheckout } = useCartUI();
  const navigate = useNavigate();

  const [pickerTargetItem, setPickerTargetItem] = useState(null);

  const cartItems = getCartItems();
  const hasUnassigned = hasUnassignedItems();
  const cartTotal = getCartTotal();

  if (!isCartOpen) return null;

  const getNormalizedFoodId = (item) => {
    if (!item) return null;
    if (item.productType === 'marketplace') {
      return item.marketplaceProductId || item.foodId || item._id;
    }
    return typeof item.foodId === 'object' && item.foodId !== null
      ? item.foodId._id
      : item.foodId;
  };

  const handleSelectRestaurant = (option) => {
    if (!pickerTargetItem) return;
    const foodId = getNormalizedFoodId(pickerTargetItem);
    const targetRestId = option.restaurantId || option._id || option.id;
    const targetRestName = option.name;
    const targetPrice = option.price;

    updateItemRestaurant(foodId, targetRestId, targetRestName, targetPrice);
    setPickerTargetItem(null);
  };

  return (
    <>
      <div className="cart-modal-overlay" onClick={closeCart}>
        <div className="cart-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="cart-modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2>Your Cart</h2>
              <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                {cartItems.length}
              </span>
            </div>
            <button className="cart-modal-close" onClick={closeCart}>
              <X size={20} />
            </button>
          </div>

          <div className="cart-modal-items">
            {cartItems.length > 0 ? (
              cartItems.map((item) => {
                const foodId = getNormalizedFoodId(item);
                const hasRest = !!item.restaurantId;
                const price = Number(item.price);
                const lineTotal = hasRest && !isNaN(price) ? price * item.quantity : null;

                return (
                  <div key={foodId} className={`cart-item ${!hasRest ? 'needs-restaurant' : ''}`}>
                    <div className="cart-item-info" style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                        {item.name}
                      </h4>

                      {/* IN-PLACE RESTAURANT SELECTION CONTROL */}
                      <div style={{ marginTop: '2px', marginBottom: '4px' }}>
                        {!hasRest ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <button
                              type="button"
                              onClick={() => setPickerTargetItem(item)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#fffdf5',
                                border: '1.5px solid #fde68a',
                                color: '#92400e',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                width: 'fit-content',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#fef3c7';
                                e.currentTarget.style.borderColor = '#f59e0b';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fffdf5';
                                e.currentTarget.style.borderColor = '#fde68a';
                              }}
                            >
                              <span>Choose Restaurant</span>
                              <ChevronDown size={13} />
                            </button>
                            <span style={{ fontSize: '11.5px', color: '#b45309', fontWeight: 600 }}>
                              Price pending selection
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <button
                              type="button"
                              onClick={() => setPickerTargetItem(item)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                color: '#0f172a',
                                padding: '4px 9px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                width: 'fit-content',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#FF6B4A';
                                e.currentTarget.style.color = '#FF6B4A';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.color = '#0f172a';
                              }}
                              title="Click to change restaurant"
                            >
                              <Store size={12} style={{ color: '#64748b' }} />
                              <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.restaurantName || 'Restaurant'}
                              </span>
                              <ChevronDown size={13} style={{ color: '#94a3b8' }} />
                            </button>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                              KES {price.toLocaleString()} × {item.quantity} = <strong>KES {(lineTotal || 0).toLocaleString()}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="cart-item-quantity">
                      <button
                        onClick={() => updateQuantity(foodId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="qty-btn"
                      >
                        −
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(foodId, item.quantity + 1)}
                        className="qty-btn"
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="cart-item-remove"
                      onClick={() => removeItem(foodId)}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="cart-empty-state">
                <ShoppingCart size={54} />
                <h3>Your cart is empty</h3>
                <p>Add items from any verified kitchen on campus.</p>
                <button
                  className="start-shopping-btn"
                  onClick={() => {
                    closeCart();
                    navigate('/menu');
                  }}
                >
                  Explore Food Catalog
                </button>
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="cart-modal-footer">
              <div className="cart-total">
                <span>Subtotal:</span>
                <span className="total-price">
                  KES {cartTotal.toLocaleString()}
                </span>
              </div>

              {hasUnassigned && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#d97706', marginBottom: '8px', fontWeight: 600 }}>
                  <AlertTriangle size={13} />
                  <span>Choose restaurant for all dishes to checkout</span>
                </div>
              )}

              <button
                className="checkout-btn"
                disabled={hasUnassigned}
                onClick={() => {
                  closeCart();
                  openCheckout();
                }}
                style={{
                  background: hasUnassigned ? '#cbd5e1' : '#FF6B4A',
                  cursor: hasUnassigned ? 'not-allowed' : 'pointer',
                  boxShadow: hasUnassigned ? 'none' : '0 4px 14px rgba(255, 107, 74, 0.35)',
                }}
              >
                {hasUnassigned ? 'Choose restaurants to continue' : 'Proceed to Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Restaurant Picker Modal for Drawer */}
      <RestaurantPickerModal
        isOpen={Boolean(pickerTargetItem)}
        item={pickerTargetItem}
        onClose={() => setPickerTargetItem(null)}
        onSelectRestaurant={handleSelectRestaurant}
      />
    </>
  );
};

export default CartDrawer;
