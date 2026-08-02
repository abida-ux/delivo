import {useEffect, useRef, useState, useMemo} from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getAllFoods } from '../services/api';
import FoodCard from './FoodCard';
import './TrendingFoods.css';

const SkeletonFoodCard = () => (
  <div className="food-card-skeleton">
    <div className="skeleton-img skeleton" />
    <div className="skeleton-body">
      <div className="skeleton skeleton-text" style={{ width: '80%' }} />
      <div className="skeleton skeleton-text sm" />
      <div className="skeleton skeleton-text sm" style={{ width: '50%' }} />
    </div>
  </div>
);

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

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        (item.category && item.category.toLowerCase().includes(term)) ||
        (typeof item.restaurant === 'object' && item.restaurant?.name?.toLowerCase().includes(term)) ||
        (typeof item.restaurant === 'string' && item.restaurant.toLowerCase().includes(term))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => {
        if (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase()) return true;
        if (item.categories && Array.isArray(item.categories)) {
          return item.categories.some(cat =>
            (typeof cat === 'object' ? cat.name : cat).toLowerCase() === selectedCategory.toLowerCase()
          );
        }
        return false;
      });
    }

    return filtered;
  }, [trendingItems, searchTerm, selectedCategory]);

  const handleScroll = (direction) => {
    const { current } = scrollContainerRef;
    if (current) {
      current.scrollBy({
        left: direction === 'left' ? -220 : 220,
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
          {(selectedCategory || searchTerm) && (
            <p className="trending-subtitle">
              {selectedCategory ? `Showing: ${selectedCategory}` : `Results for "${searchTerm}"`}
            </p>
          )}
        </div>

        <div className="trending-slider-controls">
          <button
            className="arrow-btn"
            onClick={() => handleScroll('left')}
            aria-label="Previous items"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="arrow-btn"
            onClick={() => handleScroll('right')}
            aria-label="Next items"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* FILTER INDICATOR */}
      {(selectedCategory || searchTerm) && (
        <div className="trending-filter-indicator">
          <div className="filter-info">
            {selectedCategory && (
              <span className="filter-tag">
                {selectedCategory}
                <button onClick={() => onClearFilter()} className="filter-clear-btn" title="Clear filter">
                  <X size={12} />
                </button>
              </span>
            )}
            {filteredItems.length > 0 && (
              <span className="filter-results">{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      )}

      {/* CAROUSEL */}
      <div
        className="trending-carousel-track"
        ref={scrollContainerRef}
        onMouseEnter={pauseAutoScroll}
        onMouseLeave={resumeAutoScroll}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonFoodCard key={i} />)
          : filteredItems.length === 0
          ? <p className="loading-text">
              {selectedCategory || searchTerm ? 'No foods match your search' : 'No foods available'}
            </p>
          : filteredItems.map((item) => (
              <FoodCard key={item._id} food={item} />
            ))
        }
      </div>
    </section>
  );
};

export default TrendingFoods;