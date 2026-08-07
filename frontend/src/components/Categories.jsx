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
      <div className="categories-header">
        <div className="header-text">
          <h2 className="categories-title">Browse Categories</h2>
          <p className="categories-subtitle">Find food by your cravings</p>
        </div>
        
        <div className="carousel-controls">
          <button className="control-btn" onClick={() => scroll('left')} aria-label="Scroll Left">
            <ChevronLeft size={20} />
          </button>
          <button className="control-btn" onClick={() => scroll('right')} aria-label="Scroll Right">
            <ChevronRight size={20} />
          </button>
        </div>
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
                  style={{ cursor: 'pointer' }}
                >
                  <div className="category-icon-wrapper">
                    <IconComponent size={28} className="category-icon" />
                  </div>
                  <span className="category-name">{category.name}</span>
                </div>
              );
            })}
      </div>
    </section>
  );
};

export default Categories;