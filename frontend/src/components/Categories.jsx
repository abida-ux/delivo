import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Utensils, Coffee, UtensilsCrossed, Flame, MapPin, Snail, Wine, Cake, Apple, Croissant, Pizza } from 'lucide-react';
import api from '../services/api';
import './Categories.css';

const iconMap = {
  Coffee,
  Utensils,
  UtensilsCrossed,
  Flame,
  MapPin,
  Snail,
  Wine,
  Cake,
  Apple,
  Croissant,
  Pizza,
};

const Categories = ({ onSelectCategory, selectedCategory }) => {
  const scrollContainerRef = useRef(null);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await api.get('/categories');
        setCategoriesList(res.data.data || []);
      } catch (error) {
        console.error('Error fetching categories in slider:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
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
  }, [categoriesList, loading]);

  const scroll = (direction) => {
    const { current } = scrollContainerRef;
    if (current) {
      const scrollAmount = 300;
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleCategoryClick = (categoryName) => {
    onSelectCategory(selectedCategory === categoryName ? null : categoryName);
  };

  return (
    <section className="categories-section">
      <div className="categories-section-inner">
        <div className="categories-header-row">
          <div className="categories-title-group">
            <h2 className="categories-main-title">Browse Categories</h2>
            <p className="categories-subtitle">Find food by your cravings</p>
          </div>

          {showControls && (
            <div className="categories-scroll-controls">
              <button
                className="category-arrow-btn"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                style={{ opacity: canScrollLeft ? 1 : 0.4, cursor: canScrollLeft ? 'pointer' : 'default' }}
                aria-label="Scroll Left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="category-arrow-btn"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                style={{ opacity: canScrollRight ? 1 : 0.4, cursor: canScrollRight ? 'pointer' : 'default' }}
                aria-label="Scroll Right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="categories-slider-container" ref={scrollContainerRef}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="category-pill-card skeleton-card">
                  <div className="category-icon-wrapper skeleton-icon-wrapper skeleton-pulse" />
                  <span className="category-name skeleton-name-text skeleton-pulse" />
                </div>
              ))
            : categoriesList.map((category) => {
                const IconComponent = iconMap[category.icon] || Utensils;
                const isSelected = selectedCategory === category.name;
                return (
                  <div
                    key={category._id}
                    className={`category-pill-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCategoryClick(category.name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleCategoryClick(category.name)}
                  >
                    <div className="category-icon-wrapper">
                      <IconComponent size={24} className="category-icon" />
                    </div>
                    <span className="category-name">{category.name}</span>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
};

export default Categories;