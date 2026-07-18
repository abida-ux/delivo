import {useState, useEffect} from 'react';
import { Star, Search, Plus, Check, Coffee, Utensils, UtensilsCrossed, Flame, MapPin, Snail, Wine, Cake, Apple, Croissant } from 'lucide-react';
import { getAllFoods } from '../services/api';
import { useCart } from '../context/CartContext';
import { useCartUI } from '../context/CartUIContext';
import { resolveImageUrl, handleImageError } from '../utils/placeholderImage';
import './Menu.css';

const Menu = () => {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [loading, setLoading] = useState(() => {
    try {
      const cached = sessionStorage.getItem('delivo_foods_cache');
      return !cached;
    } catch {
      return true;
    }
  });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { addItem, getCartItems } = useCart();
  const { openCart } = useCartUI();

  const categoryData = [
    { id: 1, name: 'All', icon: null },
    { id: 2, name: 'Breakfast', icon: Coffee },
    { id: 3, name: 'Lunch', icon: Utensils },
    { id: 4, name: 'Dinner', icon: UtensilsCrossed },
    { id: 5, name: 'Fast Food', icon: Flame },
    { id: 6, name: 'Street Food', icon: MapPin },
    { id: 7, name: 'Snacks', icon: Snail },
    { id: 8, name: 'Drinks', icon: Wine },
    { id: 9, name: 'Desserts', icon: Cake },
    { id: 10, name: 'Healthy', icon: Apple },
    { id: 11, name: 'Bakery', icon: Croissant },
  ];

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const response = await getAllFoods();
      const randomized = [...response].sort(() => Math.random() - 0.5);
      setFoods(randomized);
      setFilteredFoods(randomized);
      setError(null);
    } catch (err) {
      console.error('Error fetching foods:', err);
      setError('Failed to load foods');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    filterFoods(term, selectedCategory);

    // Generate real-time suggestions
    if (term.length > 0) {
      const filtered = foods.filter((food) =>
        food.name?.toLowerCase().includes(term) ||
        food.description?.toLowerCase().includes(term)
      );
      setSuggestions(filtered.slice(0, 5)); // Show top 5 suggestions
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (food) => {
    setSearchTerm(food.name);
    setSuggestions([]);
    setShowSuggestions(false);
    filterFoods(food.name, selectedCategory);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    filterFoods(searchTerm, category);
  };

  const filterFoods = (search, category) => {
    let filtered = foods;

    // Search by name or description
    if (search) {
      filtered = filtered.filter(
        (food) =>
          food.name?.toLowerCase().includes(search) ||
          food.description?.toLowerCase().includes(search)
      );
    }

    setFilteredFoods(filtered);
  };

  const handleAddToCart = (food) => {
    addItem(food, 1);
  };

  const handleGoToCart = () => {
    openCart();
  };

  // Get fresh cart items - always get latest from context
  const cartItems = getCartItems();
  const cartItemIds = cartItems.map((item) => {
    // foodId can be either a string or an object (when populated)
    return typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
  }) || [];

  if (loading) {
    return (
      <div className="menu-container">
        <div className="loading">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1>Our Menu</h1>
        <p>Explore our delicious selection of dishes</p>

        <div className="search-box-wrapper">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search foods, descriptions..."
              value={searchTerm}
              onChange={handleSearch}
              onFocus={() => searchTerm && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((food) => (
                <div
                  key={food._id}
                  className="suggestion-item"
                  onClick={() => handleSelectSuggestion(food)}
                >
                  <img
                    src={resolveImageUrl(food.image)}
                    alt={food.name}
                    className="suggestion-image"
                    onError={handleImageError}
                  />
                  <div className="suggestion-content">
                    <div className="suggestion-name">{food.name}</div>
                    <div className="suggestion-price">KES {food.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="category-filters">
        {categoryData.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              className={`category-pill ${selectedCategory === category.name ? 'active' : ''}`}
              onClick={() => handleCategoryFilter(category.name)}
            >
              {IconComponent && <IconComponent size={20} />}
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredFoods.length === 0 ? (
        <div className="no-foods">
          <p>No foods found. Try a different search or category.</p>
        </div>
      ) : (
        <div className="foods-grid">
          {filteredFoods.map((food) => (
            <div key={food._id} className="food-menu-card">
              <div className="food-image-wrapper">
                <img
                  src={resolveImageUrl(food.image)}
                  alt={food.name}
                  onError={handleImageError}
                />
                <div className="food-badge">
                  <Star size={16} fill="currentColor" />
                  <span>4.5</span>
                </div>
              </div>

              <div className="food-details">
                <h3 className="food-name">{food.name}</h3>
                <p className="food-description">{food.description}</p>

                <div className="food-footer">
                  <span className="food-price">KES {food.price}</span>
                  {cartItemIds.includes(food._id) ? (
                    <button
                      className="go-to-cart-ui"
                      onClick={handleGoToCart}
                    >
                      <Check size={18} />
                      <span>Go to Cart</span>
                    </button>
                  ) : (
                    <button
                      className="add-to-cart-ui"
                      onClick={() => handleAddToCart(food)}
                    >
                      <Plus size={18} />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;
