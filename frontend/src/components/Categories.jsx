import {useRef} from 'react';
import { ChevronLeft, ChevronRight, UtensilsCrossed, Coffee, Utensils, Flame, MapPin, Snail, Wine, Cake, Apple, Croissant } from 'lucide-react';
import './Categories.css';

const Categories = ({ onSelectCategory, selectedCategory }) => {
  const scrollContainerRef = useRef(null);

  const categoryData = [
    { id: 1, name: 'Breakfast', icon: Coffee },
    { id: 2, name: 'Lunch', icon: Utensils },
    { id: 3, name: 'Dinner', icon: UtensilsCrossed },
    { id: 4, name: 'Fast Food', icon: Flame },
    { id: 5, name: 'Street Food', icon: MapPin },
    { id: 6, name: 'Snacks', icon: Snail },
    { id: 7, name: 'Drinks', icon: Wine },
    { id: 8, name: 'Desserts', icon: Cake },
    { id: 9, name: 'Healthy', icon: Apple },
    { id: 10, name: 'Bakery', icon: Croissant },
  ];

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
        
        {/* Navigation Arrows for Desktop */}
        <div className="carousel-controls">
          <button className="control-btn" onClick={() => scroll('left')} aria-label="Scroll Left">
            <ChevronLeft size={20} />
          </button>
          <button className="control-btn" onClick={() => scroll('right')} aria-label="Scroll Right">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Container */}
      <div className="categories-slider-container" ref={scrollContainerRef}>
        {categoryData.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory === category.name;
          return (
            <div 
              key={category.id} 
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