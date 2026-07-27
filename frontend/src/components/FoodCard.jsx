import { Plus, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCartUI } from '../context/CartUIContext';
import { useState } from 'react';
import './FoodCard.css';

const FoodCard = ({ food }) => {
  const navigate = useNavigate();
  const { addItem, getCartItems } = useCart();
  const { openCart } = useCartUI();
  const [imageError, setImageError] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

  // Derive "in cart" state from actual cart context
  const cartItems = getCartItems();
  const isInCart = cartItems.some(item => {
    const id = typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
    return id === food._id;
  });

  const isObjectId = (str) => typeof str === 'string' && /^[0-9a-fA-F]{24}$/.test(str);

  const restaurantName = typeof food.restaurant === 'object'
    ? food.restaurant?.name
    : (food.restaurant && !isObjectId(food.restaurant) ? food.restaurant : '');

  const handleAddToCart = () => {
    addItem(food, 1); // Add exactly 1 item directly
  };

  return (
    <div className="food-card" onClick={() => navigate(`/food/${food._id}`)} style={{ cursor: 'pointer' }}>
      <div className="food-image-wrapper">
        <img
          src={imageError ? fallbackImage : (food.image || fallbackImage)}
          alt={food.name}
          className="food-image"
          onError={() => setImageError(true)}
        />
      </div>

      <div className="food-info">
        <div className="food-meta-head">
          <h3 className="food-name">{food.name}</h3>
          <p className="food-vendor">{restaurantName}</p>
        </div>

        <div className="food-action-row">
          <span className="food-price">KES {food.price}</span>

          {food.isCombination ? (
            <button
              className="add-to-cart-btn"
              onClick={(e) => { e.stopPropagation(); navigate(`/food/${food._id}`); }}
              style={{ background: '#f97316' }}
            >
              Customise
            </button>
          ) : isInCart ? (
            <button
              className="go-to-cart-btn"
              onClick={(e) => { e.stopPropagation(); openCart(); }}
            >
              <ShoppingCart size={14} style={{ marginRight: '4px' }} /> Go to Cart
            </button>
          ) : (
            <button
              className="add-to-cart-btn"
              onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
            >
              <Plus size={14} style={{ marginRight: '4px' }} /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
