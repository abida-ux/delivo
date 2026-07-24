import { Star, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCartUI } from '../context/CartUIContext';
import { useState } from 'react';
import './FoodCard.css';

const FoodCard = ({ food }) => {
  const { addItem, getCartItems } = useCart();
  const { openCart } = useCartUI();
  const [quantity, setQuantity] = useState(1);

  // Derive "in cart" state from actual cart context — no more fake 3-second timer
  const cartItems = getCartItems();
  const isInCart = cartItems.some(item => {
    const id = typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
    return id === food._id;
  });

  const restaurantName = typeof food.restaurant === 'object'
    ? food.restaurant?.name
    : food.restaurant || 'Restaurant';

  const handleAddToCart = () => {
    addItem(food, quantity);
    setQuantity(1); // Reset quantity after adding
  };

  return (
    <div className="food-card">
      <div className="food-image-wrapper">
        <img
          src={food.image}
          alt={food.name}
          className="food-image"
        />
        <div className="food-rating-tag">
          <Star size={12} className="star-icon-filled" />
          <span>{food.rating || 4.5}</span>
        </div>
      </div>

      <div className="food-info">
        <div className="food-meta-head">
          <h3 className="food-name">{food.name}</h3>
          <p className="food-vendor">{restaurantName}</p>
        </div>

        <div className="food-action-row">
          <span className="food-price">KES {food.price}</span>

          {isInCart ? (
            <button
              className="go-to-cart-btn"
              onClick={openCart}
            >
              <ShoppingCart size={16} />
              <span className="btn-text">In Cart</span>
            </button>
          ) : (
            <div className="quantity-selector">
              <div className="qty-controls">
                <button
                  className="qty-btn-small"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus size={14} />
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  className="qty-btn-small"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                className="add-to-cart-btn"
                onClick={handleAddToCart}
              >
                <ShoppingCart size={16} />
                <span className="btn-text">Add</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
