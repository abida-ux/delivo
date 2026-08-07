import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  MapPin,
  Truck,
  ChevronRight,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Store,
  UtensilsCrossed,
  CheckCircle2,
} from 'lucide-react';
import api, { rateFood } from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import { useCartUI } from '../../context/CartUIContext';
import { AuthContext } from '../../context/AuthContext';
import { AuthModalContext } from '../../context/AuthModalContext';
import FoodCard from '../../components/FoodCard';
import { resolveImageUrl } from '../../utils/placeholderImage';
import './FoodDetailsPage.css';
import SEO from '../../components/SEO';

const FoodDetailsPage = () => {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const { location } = useLocation();
  const { addItem } = useCart();
  const { openCart } = useCartUI();
  const { user } = useContext(AuthContext);
  const { openLoginModal } = useContext(AuthModalContext) || {};


  const [food, setFood] = useState(null);
  const [sellingRestaurants, setSellingRestaurants] = useState([]);
  const [similarFoods, setSimilarFoods] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1-Tap Rating State
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingMessage, setRatingMessage] = useState(null);
  const [ratingMessageType, setRatingMessageType] = useState('success');

  useEffect(() => {
    let isMounted = true;

    const fetchFoodData = async () => {
      try {
        setLoading(true);
        setError(null);

        const lat = location.latitude || '';
        const lng = location.longitude || '';

        const [foodRes, restRes] = await Promise.all([
          api.get(`/foods/${foodId}`),
          api.get(`/foods/${foodId}/restaurants?lat=${lat}&lng=${lng}`),
        ]);

        const currentFood = foodRes.data?.data;
        if (!currentFood) throw new Error('Dish not found');

        if (isMounted) {
          setFood(currentFood);
          if (currentFood.userRating) setUserRating(currentFood.userRating);
          setSellingRestaurants(restRes.data?.data || []);
        }


        const categoryName = typeof currentFood.category === 'object'
          ? currentFood.category?.name
          : currentFood.category;

        if (categoryName) {
          const simRes = await api.get(`/foods?category=${encodeURIComponent(categoryName)}&limit=5`);
          if (isMounted && simRes.data?.data) {
            setSimilarFoods(simRes.data.data.filter((item) => item._id !== foodId).slice(0, 4));
          }
        }
      } catch (err) {
        console.error('Error fetching food details:', err);
        if (isMounted) setError(err.response?.data?.message || 'Failed to load meal details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFoodData();
    return () => { isMounted = false; };
  }, [foodId, location.latitude, location.longitude]);

  // Handle 1-Tap Dish Rating
  const handleRateFood = async (starVal) => {
    if (!user) {
      setRatingMessage('Please sign in to rate this dish!');
      setRatingMessageType('warning');
      if (openLoginModal) openLoginModal();
      return;
    }


    try {
      const res = await rateFood(foodId, starVal);
      if (res?.success) {
        setUserRating(starVal);
        setFood((prev) => ({
          ...prev,
          rating: res.data.rating,
          numReviews: res.data.numReviews,
        }));
        setRatingMessage(`✓ Thank you! You rated this dish ${starVal}★`);
        setRatingMessageType('success');
      }
    } catch (err) {
      console.error('Error rating food:', err);
      setRatingMessage(err.response?.data?.message || 'Failed to submit rating');
      setRatingMessageType('warning');
    }
  };

  if (loading) {
    return (
      <div className="food-details-page-wrap">
        <div className="food-details-container">
          <div className="food-skeleton-hero">
            <div className="food-skeleton-img shimmer"></div>
            <div className="food-skeleton-info">
              <div className="food-skeleton-title shimmer"></div>
              <div className="food-skeleton-text shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="food-details-page-wrap">
        <div className="food-details-container" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <UtensilsCrossed size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
          <h2>Dish Not Found</h2>
          <p>{error || 'The meal you requested is unavailable.'}</p>
          <button className="food-back-menu-btn" onClick={() => navigate('/menu')}>
            <ArrowLeft size={16} /> Return to Menu
          </button>
        </div>
      </div>
    );
  }

  const categoryName = typeof food.category === 'object' ? food.category?.name : (food.category || 'Specialty');
  const primaryVendor = sellingRestaurants[0] || {
    restaurantId: food.restaurant?._id || 'default',
    name: food.restaurant?.name || 'Delivo Kitchen',
    rating: food.restaurant?.rating || 4.5,
    deliveryFee: 50,
    deliveryTime: '20-30',
  };

  const unitPrice = primaryVendor.price || food.price || 350;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem({ ...food, price: unitPrice, restaurantId: primaryVendor.restaurantId }, quantity);
    openCart();
  };

  const productSchema = food ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": food.name,
    "image": food.image || "https://delivo.co.ke/delivo.jpg",
    "description": food.description || `Order delicious ${food.name} online on Delivo.`,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "KES",
      "price": unitPrice,
      "availability": food.defaultAvailability !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": primaryVendor.name || "Delivo Vendor"
      }
    }
  } : null;

  return (
    <div className="food-details-page-wrap">
      <SEO
        title={food.name}
        description={food.description ? (food.description.length > 150 ? food.description.substring(0, 150) + '...' : food.description) : `Order delicious ${food.name} online on Delivo. Lightning-fast on-demand delivery to your door.`}
        image={food.image}
        schema={productSchema}
      />
      <div className="food-details-container">
        {/* Breadcrumb */}
        <nav className="food-breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/menu')}>Menu</button>
          <ChevronRight size={14} />
          {categoryName && <span>{categoryName}</span>}
          <ChevronRight size={14} />
          <strong className="active">{food.name}</strong>
        </nav>

        {/* Core Hero Layout */}
        <div className="food-hero-card">
          <div className="food-image-frame">
            <img src={resolveImageUrl(food.image)} alt={food.name} />
          </div>

          <div className="food-info-panel">
            <span className="category-chip">{categoryName}</span>
            <h1 className="dish-name">{food.name}</h1>
            <p className="dish-description">{food.description || 'Prepared fresh with high quality ingredients.'}</p>

            <div className="price-display">
              <span className="price-tag">KES {unitPrice.toLocaleString('en-KE')}</span>
            </div>

            {/* REAL RATING SCORE & 1-TAP STAR RATING WIDGET */}
            <div className="dish-rating-widget-box">
              <div className="rating-score-display">
                <div className="rating-stars-badge">
                  <Star size={16} fill={food.rating > 0 ? '#f5b301' : 'none'} color={food.rating > 0 ? '#f5b301' : '#9ca3af'} />
                  <strong>{food.rating > 0 ? food.rating : 'New'}</strong>
                </div>
                <span className="reviews-count-text">
                  {food.numReviews > 0 ? `(${food.numReviews} ${food.numReviews === 1 ? 'rating' : 'ratings'})` : 'No ratings yet'}
                </span>
              </div>

              <div className="one-tap-rating-picker">
                <span className="rate-prompt-text">Tap to rate:</span>
                <div className="stars-picker-group">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      className="star-rate-btn"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRateFood(starVal)}
                      title={`Rate ${starVal} ${starVal === 1 ? 'star' : 'stars'}`}
                    >
                      <Star
                        size={18}
                        fill={(hoverRating || userRating || 0) >= starVal ? '#f5b301' : 'none'}
                        color={(hoverRating || userRating || 0) >= starVal ? '#f5b301' : '#d1d5db'}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {ratingMessage && (
              <div className={`rating-status-message ${ratingMessageType}`}>
                {ratingMessage}
              </div>
            )}

            {/* Vendor Stats */}
            <div className="vendor-meta-box">
              <div className="meta-item">
                <Store size={14} color="#FF6B4A" />
                <span>{primaryVendor.name}</span>
              </div>
              <div className="meta-item">
                <Clock size={14} color="#FF6B4A" />
                <span>{primaryVendor.deliveryTime || '20-30'} mins</span>
              </div>
              <div className="meta-item">
                <Truck size={14} color="#FF6B4A" />
                <span>KES {primaryVendor.deliveryFee || 50} delivery</span>
              </div>
            </div>

            {/* Quantity Stepper & Add to Cart */}
            <div className="order-stepper-row">
              <div className="stepper-controls">
                <button disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <Minus size={14} />
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)}>
                  <Plus size={14} />
                </button>
              </div>

              <button className="add-to-cart-btn" onClick={handleAddToCart}>
                <ShoppingBag size={18} /> Add {quantity} to Cart • KES {totalPrice.toLocaleString()}
              </button>
            </div>
          </div>
        </div>

        {/* Similar Foods */}

        {similarFoods.length > 0 && (
          <section className="similar-foods-section">
            <h3>You May Also Like</h3>
            <div className="similar-cards-grid">
              {similarFoods.map((item) => (
                <FoodCard key={item._id} food={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default FoodDetailsPage;
