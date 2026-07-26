import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, Truck, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import { resolveImageUrl } from '../../utils/placeholderImage';
import './FoodDetailsPage.css';

const FoodDetailsPage = () => {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const { location } = useLocation();
  const { addItem } = useCart();

  const [food, setFood] = useState(null);
  const [sellingRestaurants, setSellingRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFoodDetailsAndVendors = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch main catalog food info
        const foodRes = await api.get(`/foods/${foodId}`);
        setFood(foodRes.data.data);

        // 2. Fetch list of restaurants selling this food
        const lat = location.latitude || '';
        const lng = location.longitude || '';
        const restRes = await api.get(`/foods/${foodId}/restaurants?lat=${lat}&lng=${lng}`);
        setSellingRestaurants(restRes.data.data || []);
      } catch (err) {
        console.error('Failed to load food details page details:', err);
        setError('Failed to load food details page items');
      } finally {
        setLoading(false);
      }
    };

    fetchFoodDetailsAndVendors();
  }, [foodId, location.latitude, location.longitude]);

  const handleOrderFromRestaurant = (rest) => {
    // 1. Pre-configure cart item bound to this restaurant
    const foodWithSelectedPrice = {
      ...food,
      price: rest.price,
      restaurantId: rest.restaurantId,
    };
    
    addItem(foodWithSelectedPrice, 1);
    
    // 2. Navigate to that restaurant's detail menu page!
    navigate(`/restaurants/${rest.restaurantId}`);
  };

  if (loading) {
    return (
      <div className="food-details-container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <p style={{ fontSize: '18px', color: '#6b7280', fontWeight: '500' }}>Loading details...</p>
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="food-details-container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <p style={{ fontSize: '18px', color: '#ef4444', fontWeight: '600' }}>{error || 'Food item not found'}</p>
      </div>
    );
  }

  return (
    <div className="food-details-container">
      
      {/* breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/menu')}>Menu</span>
        <ChevronRight size={14} />
        <span style={{ color: '#111827' }}>{food.name}</span>
      </div>

      {/* HERO SECTION */}
      <div className="food-details-hero">
        <div className="food-details-img-wrapper">
          <img
            src={resolveImageUrl(food.image)}
            alt={food.name}
            className="food-details-img"
          />
        </div>
        <div className="food-details-info">
          <h1 className="food-details-name">{food.name}</h1>
          <p className="food-details-desc">{food.description}</p>
          
          <div className="food-details-meta">
            <span className="meta-pill">Category: {food.category || 'Standard'}</span>
            {food.prepTime && <span className="meta-pill">Prep Time: {food.prepTime} mins</span>}
          </div>
        </div>
      </div>

      {/* SELLING RESTAURANTS SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 className="restaurants-section-title">Available from {sellingRestaurants.length} Restaurants</h2>
        
        {sellingRestaurants.length === 0 ? (
          <div style={{ padding: '40px', background: '#f9fafb', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontWeight: '500', margin: 0 }}>
              No restaurants are currently selling this food item near you.
            </p>
          </div>
        ) : (
          <div className="restaurants-grid">
            {sellingRestaurants.map((rest) => (
              <div key={rest.restaurantId} className="restaurant-selling-card">
                
                <div className="rest-card-header">
                  <div>
                    <h3 className="rest-card-name">{rest.name}</h3>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: rest.isOpen ? '#10b981' : '#ef4444',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {rest.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                  <span className="rest-card-rating">
                    <Star size={12} fill="#d97706" />
                    {rest.rating}
                  </span>
                </div>

                <div className="rest-card-details">
                  <div className="detail-item-col">
                    <span className="detail-item-label"><MapPin size={11} style={{ display: 'inline', marginRight: '4px' }} /> Distance</span>
                    <span className="detail-item-val">{rest.distance} km</span>
                  </div>
                  <div className="detail-item-col">
                    <span className="detail-item-label"><Truck size={11} style={{ display: 'inline', marginRight: '4px' }} /> Delivery Fee</span>
                    <span className="detail-item-val">KES {rest.deliveryFee}</span>
                  </div>
                  <div className="detail-item-col">
                    <span className="detail-item-label"><Clock size={11} style={{ display: 'inline', marginRight: '4px' }} /> Delivery Time</span>
                    <span className="detail-item-val">{rest.deliveryTime} mins</span>
                  </div>
                </div>

                <div className="rest-card-action-row">
                  <div className="rest-card-price">KES {rest.price}</div>
                  <button
                    className="order-now-cta-btn"
                    onClick={() => handleOrderFromRestaurant(rest)}
                    disabled={!rest.isOpen}
                  >
                    Order Now
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default FoodDetailsPage;
