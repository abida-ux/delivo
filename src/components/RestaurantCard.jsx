import React, { useState, useEffect, useRef } from 'react';
import { Star, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllRestaurants } from '../services/api';
import './RestaurantCard.css';

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
      
      // Fetch and shuffle randomly
      // Improved random shuffle
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
      scrollContainerRef.current.scrollBy({
        left: -350,
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 350,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <section className="restaurants-section">
        <div className="section-header-wrapper">
          <div className="section-title-group">
            <h2 className="section-main-title">Popular Restaurants Near You</h2>
            <p className="section-subtitle">Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="restaurants-section">
        <div className="section-header-wrapper">
          <div className="section-title-group">
            <h2 className="section-main-title">Popular Restaurants Near You</h2>
            <p className="section-subtitle" style={{ color: '#ff6b6b' }}>
              {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="restaurants-section">

      {/* HEADER */}
      <div className="section-header-wrapper">

        <div className="section-title-group">
          <h2 className="section-main-title">
            Popular Restaurants Near You
          </h2>
          <p className="section-subtitle">
            Discover top-rated places delivering to your area
          </p>
        </div>

      </div>

      {/* CAROUSEL CONTAINER WITH SCROLL BUTTONS */}
      <div className="carousel-wrapper">
        
        <button 
          className="scroll-btn scroll-btn-left" 
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft size={24} />
        </button>

        <div 
          className="restaurants-grid"
          ref={scrollContainerRef}
        >
          {restaurants.map((restaurant) => (
            <div
              key={restaurant._id}
              className="restaurant-card"
              onClick={() => handleRestaurantClick(restaurant._id)}
              style={{ cursor: 'pointer' }}
            >

              {/* IMAGE */}
              <div className="card-image-container">

                <img
                  src={restaurant.bannerImage}
                  alt={restaurant.name}
                  className="restaurant-img"
                />

              </div>

              {/* DETAILS */}
              <div className="card-details">

                <div className="card-title-row">

                  <h3 className="restaurant-name">
                    {restaurant.name}
                  </h3>

                  <div className="rating-badge">
                    <Star className="icon-star" size={14} />
                    <span>{restaurant.rating}</span>
                  </div>

                </div>

                <p className="cuisine-text">
                  {restaurant.cuisine?.join(' • ') || 'Restaurant'}
                </p>

                <div className="card-footer-metrics">

                  <div className="metric-item">
                    <Clock size={14} className="icon-metric" />
                    <span>{restaurant.deliveryTime || '30 mins'}</span>
                  </div>

                  <span className="metric-separator">•</span>

                  <span className="delivery-fee-text">
                    {restaurant.isOpen ? '🟢 Open' : '🔴 Closed'}
                  </span>

                </div>

              </div>

            </div>
          ))}

        </div>

        <button 
          className="scroll-btn scroll-btn-right" 
          onClick={scrollRight}
          aria-label="Scroll right"
        >
          <ChevronRight size={24} />
        </button>

      </div>

    </section>
  );
};

export default RestaurantCard;