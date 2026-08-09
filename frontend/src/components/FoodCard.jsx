import { Plus, Check, Star, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCartUI } from '../context/CartUIContext';
import { useState, useEffect } from 'react';
import { resolveImageUrl } from '../utils/placeholderImage';
import './FoodCard.css';

const FoodCard = ({ food }) => {
  const navigate = useNavigate();
  const { addItem, getCartItems } = useCart();
  const { openCart } = useCartUI();
  const [imageError, setImageError] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!food.flashSaleEnd) return;

    const calculateTimeLeft = () => {
      const difference = new Date(food.flashSaleEnd) - new Date();
      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        // Refresh page or trigger re-fetch to load normal prices
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const formatted = [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0')
      ].join(':');

      setTimeLeft(formatted);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [food.flashSaleEnd]);

  const fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

  const cartItems = getCartItems();
  const isInCart = cartItems.some((item) => {
    const id = typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
    return id === food._id;
  });

  const isObjectId = (str) => typeof str === 'string' && /^[0-9a-fA-F]{24}$/.test(str);

  const restaurantName = typeof food.restaurant === 'object'
    ? food.restaurant?.name
    : (food.restaurant && !isObjectId(food.restaurant) ? food.restaurant : 'Delivo Kitchen');

  const ratingScore = food.rating > 0 ? food.rating : null;
  const imageSrc = imageError ? fallbackImage : resolveImageUrl(food.image || fallbackImage);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addItem(food, 1);
  };

  const handleOpenCart = (e) => {
    e.stopPropagation();
    openCart();
  };

  return (
    <div className="food-card" onClick={() => navigate(`/food/${food._id}`)}>
      {/* Warm Cream Image Frame */}
      <div className="food-image-card">
        <img
          src={imageSrc}
          alt={food.name}
          className="food-image"
          onError={() => setImageError(true)}
          loading="lazy"
        />

        {/* Floating Discount Tag */}
        {food.originalPrice && food.originalPrice > food.price && (
          <span className="food-discount-badge">
            {Math.round(((food.originalPrice - food.price) / food.originalPrice) * 100)}% OFF
          </span>
        )}

        {/* Floating Plus Button on bottom-right of image frame */}
        <button
          className={`floating-plus-btn ${isInCart ? 'in-cart' : ''}`}
          onClick={isInCart ? handleOpenCart : handleAddToCart}
          title={isInCart ? 'In Cart - View Order' : 'Add to Order'}
        >
          {isInCart ? <Check size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {/* Card Details Below Image Card */}
      <div className="food-card-details">
        <div className="vendor-rating-row">
          <div className="vendor-info">
            <span className="vendor-dot"></span>
            <span className="vendor-name" title={restaurantName}>{restaurantName}</span>
          </div>

          {ratingScore > 0 && (
            <div className="rating-tag">
              <Star size={11} fill="#f5b301" color="#f5b301" />
              <span>{ratingScore}</span>
            </div>
          )}
        </div>



        <h3 className="food-name" title={food.name}>{food.name}</h3>

        <div className="food-price-row">
          <span className="food-price">KES {food.price?.toLocaleString('en-KE')}</span>
          {food.originalPrice && food.originalPrice > food.price && (
            <span className="food-old-price">KES {food.originalPrice.toLocaleString('en-KE')}</span>
          )}
        </div>

        {food.flashSaleEnd && (
          <div className="food-card-countdown" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: '#ef4444', marginTop: '4px' }}>
            <Clock size={12} />
            <span>Ends in {timeLeft}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodCard;
