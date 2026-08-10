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

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowControls(scrollWidth > clientWidth + 5);
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      const timer = setTimeout(updateScrollButtons, 300);
      return () => {
        el.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
        clearTimeout(timer);
      };
    }
  }, [restaurants, loading]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllRestaurants();
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      setRestaurants(shuffled.slice(0, 6));
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

        {showControls && (
          <div className="restaurant-scroll-controls">
            <button 
              className="restaurant-arrow-btn" 
              onClick={scrollLeft} 
              disabled={!canScrollLeft}
              style={{ opacity: canScrollLeft ? 1 : 0.4, cursor: canScrollLeft ? 'pointer' : 'default' }}
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              className="restaurant-arrow-btn" 
              onClick={scrollRight} 
              disabled={!canScrollRight}
              style={{ opacity: canScrollRight ? 1 : 0.4, cursor: canScrollRight ? 'pointer' : 'default' }}
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="carousel-wrapper">
        <div className="restaurants-grid" ref={scrollContainerRef}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : error
            ? <p style={{ padding: '1rem', color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{error}</p>
            : restaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                className="restaurant-card"
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
                    {restaurant.rating > 0 && (
                      <div className="rating-badge">
                        <Star className="icon-star" size={11} fill="currentColor" />
                        <span>{restaurant.rating}</span>
                      </div>
                    )}
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
      </div>
    </section>
  );
};

export default RestaurantCard;