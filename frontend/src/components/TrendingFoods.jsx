import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Star, Plus, ChevronLeft, ChevronRight, ShoppingCart, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCartUI } from '../context/CartUIContext';
import { getAllFoods } from '../services/api';
import './TrendingFoods.css';

const TrendingFoods = ({ searchTerm = '', selectedCategory = null, onClearFilter, isFlashDeal = false }) => {
  const scrollContainerRef = useRef(null);
  const { addItem, getCartItems } = useCart();
  const { openCart } = useCartUI();

  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get cart items to check if item is in cart
  const cartItems = getCartItems();
  const cartItemIds = cartItems.map(item => {
    // foodId can be either a string or an object (when populated)
    return typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
  }) || [];

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setLoading(true);

        const foods = await getAllFoods();

        // ✅ API service returns array directly
        // Randomize foods
        const randomized = [...foods].sort(() => Math.random() - 0.5);
        setTrendingItems(randomized);
      } catch (err) {
        console.error('Error fetching foods:', err);
        setError('Failed to load foods');
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();

    // Auto-scroll every 8 seconds
    const autoScrollInterval = setInterval(() => {
      handleScroll('right');
    }, 8000);

    return () => clearInterval(autoScrollInterval);
  }, []);

  // Filter foods based on category and search term
  const filteredItems = useMemo(() => {
    let filtered = [...trendingItems];

    // Filter by search term (name or category field)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        (item.category && item.category.toLowerCase().includes(term)) ||
        (typeof item.restaurant === 'object' && item.restaurant?.name?.toLowerCase().includes(term)) ||
        (typeof item.restaurant === 'string' && item.restaurant.toLowerCase().includes(term))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(item => {
        const itemCategory = item.category || '';
        return itemCategory.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    return filtered;
  }, [trendingItems, searchTerm, selectedCategory]);

  const handleScroll = (direction) => {
    const { current } = scrollContainerRef;

    if (current) {
      const offset = 340;

      current.scrollBy({
        left: direction === 'left' ? -offset : offset,
        behavior: 'smooth',
      });
    }
  };

  const handleAddToCart = (item) => {
    addItem(item, 1);
  };

  if (error) {
    return (
      <section className="trending-section">
        <p className="loading-text">{error}</p>
      </section>
    );
  }

  return (
    <section className="trending-section">
      <div className="trending-header">
        <div className="header-left">
          <h2 className="trending-title">
            {selectedCategory ? `${selectedCategory} Foods` : 'Popular Near You'}
          </h2>
          <p className="trending-subtitle">
            {selectedCategory 
              ? `Showing ${selectedCategory.toLowerCase()} items` 
              : searchTerm 
              ? `Search results for "${searchTerm}"` 
              : 'Most ordered meals in your area'}
          </p>
        </div>

        <div className="trending-slider-controls">
          <button
            className="arrow-btn"
            onClick={() => handleScroll('left')}
            aria-label="Previous items"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            className="arrow-btn"
            onClick={() => handleScroll('right')}
            aria-label="Next items"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* FILTER INDICATOR */}
      {(selectedCategory || searchTerm) && (
        <div className="trending-filter-indicator">
          <div className="filter-info">
            {selectedCategory && (
              <span className="filter-tag">
                Category: <strong>{selectedCategory}</strong>
                <button 
                  onClick={() => onClearFilter()}
                  className="filter-clear-btn"
                  title="Clear category filter"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="filter-tag">
                Search: <strong>"{searchTerm}"</strong>
              </span>
            )}
            {(selectedCategory || searchTerm) && filteredItems.length > 0 && (
              <span className="filter-results">
                Found {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <p className="loading-text">Loading foods...</p>
      ) : (
        <div
          className="trending-carousel-track"
          ref={scrollContainerRef}
        >
          {filteredItems.length === 0 ? (
            <p className="loading-text">
              {selectedCategory || searchTerm 
                ? 'No foods match your search or category' 
                : 'No foods available'}
            </p>
          ) : (
            filteredItems.map((item) => (
              <div key={item._id} className="food-card">
                <div className="food-image-wrapper">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="food-image"
                  />

                  <div className="food-rating-tag">
                    <Star size={12} className="star-icon-filled" />
                    <span>{item.rating}</span>
                  </div>
                </div>

                <div className="food-info">
                  <div className="food-meta-head">
                    <h3 className="food-name">{item.name}</h3>
                    <p className="food-vendor">
                      {typeof item.restaurant === 'object' 
                        ? item.restaurant?.name 
                        : item.restaurant || 'Restaurant'}
                    </p>
                  </div>

                  <div className="food-action-row">
                    <span className="food-price">
                      KES {item.price}
                    </span>

                    {cartItemIds.includes(item._id) ? (
                      <button
                        className="go-to-cart-ui"
                        onClick={openCart}
                      >
                        <ShoppingCart size={18} />
                        <span>Go to Cart</span>
                      </button>
                    ) : (
                      <button
                        className="add-to-cart-ui"
                        onClick={() => handleAddToCart(item)}
                        aria-label={`Add ${item.name} to cart`}
                      >
                        <Plus size={18} />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default TrendingFoods;