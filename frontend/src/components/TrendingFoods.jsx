import {useEffect, useRef, useState, useMemo} from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getAllFoods } from '../services/api';
import FoodCard from './FoodCard';
import './TrendingFoods.css';

const TrendingFoods = ({ searchTerm = '', selectedCategory = null, onClearFilter, isFlashDeal = false }) => {
  const scrollContainerRef = useRef(null);
  const autoScrollRef = useRef(null);

  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, []);

  // Auto-scroll every 8 seconds — pauses on hover
  useEffect(() => {
    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        handleScroll('right');
      }, 8000);
    };

    startAutoScroll();
    return () => clearInterval(autoScrollRef.current);
  }, []);

  const pauseAutoScroll = () => clearInterval(autoScrollRef.current);
  const resumeAutoScroll = () => {
    clearInterval(autoScrollRef.current);
    autoScrollRef.current = setInterval(() => {
      handleScroll('right');
    }, 8000);
  };

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
            {selectedCategory ? `${selectedCategory} Foods` : 'Handpicked for You'}
          </h2>
          <p className="trending-subtitle">
            {selectedCategory 
              ? `Showing ${selectedCategory.toLowerCase()} items` 
              : searchTerm 
              ? `Search results for "${searchTerm}"` 
              : 'Top-rated meals from trusted local kitchens'}
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
          onMouseEnter={pauseAutoScroll}
          onMouseLeave={resumeAutoScroll}
        >
          {filteredItems.length === 0 ? (
            <p className="loading-text">
              {selectedCategory || searchTerm 
                ? 'No foods match your search or category' 
                : 'No foods available'}
            </p>
          ) : (
            filteredItems.map((item) => (
              <FoodCard key={item._id} food={item} />
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default TrendingFoods;