import React, { useState } from 'react';
import { Star, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './FoodCard.css';

const FoodCard = ({ food }) => {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    console.log('🛒 Starting to add item:', food.name);
    // Add item to cart and wait for it
    await addItem(food, quantity);
    
    // Immediately show "In Cart" button
    console.log('🔵 Setting added=true');
    setAdded(true);
    console.log('✅ Item added, showing In Cart button');
    
    // Reset after 3 seconds
    const timeout = setTimeout(() => {
      console.log('⏰ Timeout: resetting to Add button');
      setAdded(false);
    }, 3000);
    
    return () => clearTimeout(timeout);
  };

  const handleGoToCart = () => {
    navigate('/customer/cart');
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
          <p className="food-vendor">{food.restaurant}</p>
        </div>

        <div className="food-action-row">
          <span className="food-price">${food.price}</span>

          {added ? (
            <button
              className="go-to-cart-btn"
              onClick={handleGoToCart}
            >
              <ShoppingCart size={16} />
              In Cart
            </button>
          ) : (
            <div className="quantity-selector">
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
              <button
                className="add-to-cart-btn"
                onClick={handleAddToCart}
              >
                <ShoppingCart size={16} />
                Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
