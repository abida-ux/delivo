import {useState, useEffect, useRef} from 'react';
import { Star, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllRestaurants } from '../services/api';
import { resolveRestaurantImageUrl, handleImageError } from '../utils/placeholderImage';
import './RestaurantCard.css';

const SkeletonCard = () => (
  <div className="restaurant-skeleton">
    <div className="sk-image skeleton" />
    <div className="sk-body">
      <div className="skeleton skeleton-text" style={{ width: '70%' }} />
      <div className="skeleton skeleton-text sm" />
      <div className="skeleton skeleton-text sm" style={{ width: '50%' }} />
    </div>
  </div>
);

const RestaurantCard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllRestaurants();
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      setRestaurants(shuffled);
    } catch (err) {
      setError('Failed to load restaurants');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/restaurants/${restaurantId}`);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section className="restaurants-section">
      <div className="section-header-wrapper">
        <div className="section-title-group">
          <h2 className="section-main-title">Popular Restaurants</h2>
          <p className="section-subtitle">Discover top-rated places delivering to your area</p>
        </div>
      </div>

      <div className="carousel-wrapper">
        <button className="scroll-btn scroll-btn-left" onClick={scrollLeft} aria-label="Scroll left">
          <ChevronLeft size={20} />
        </button>

        <div className="restaurants-grid" ref={scrollContainerRef}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : error
            ? <p style={{ padding: '1rem', color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{error}</p>
            : restaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                className="restaurant-card"
                onClick={() => handleRestaurantClick(restaurant._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleRestaurantClick(restaurant._id)}
                aria-label={`View ${restaurant.name}`}
              >
                {/* IMAGE */}
                <div className="card-image-container">
                  <img
                    src={resolveRestaurantImageUrl(restaurant)}
                    alt={restaurant.name}
                    className="restaurant-img"
                    onError={handleImageError}
                    loading="lazy"
                  />
                  {/* Status badge on image */}
                  <span className={`restaurant-status-badge ${restaurant.isOpen === false ? 'closed' : 'open'}`}>
                    {restaurant.isOpen === false ? 'Closed' : 'Open'}
                  </span>
                </div>

                {/* DETAILS */}
                <div className="card-details">
                  <div className="card-title-row">
                    <h3 className="restaurant-name">{restaurant.name}</h3>
                    <div className="rating-badge">
                      <Star className="icon-star" size={11} fill="currentColor" />
                      <span>{restaurant.rating || '4.0'}</span>
                    </div>
                  </div>

                  <p className="cuisine-text">
                    {restaurant.cuisine?.join(' • ') || 'Restaurant'}
                  </p>

                  <div className="card-footer-metrics">
                    <div className="metric-item">
                      <Clock size={12} className="icon-metric" />
                      <span>{restaurant.deliveryTime || '25–35 min'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          }
        </div>

        <button className="scroll-btn scroll-btn-right" onClick={scrollRight} aria-label="Scroll right">
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
};

export default RestaurantCard;