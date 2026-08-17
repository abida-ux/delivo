import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Star, Search, Plus, Check, Coffee, Utensils, UtensilsCrossed, Flame, MapPin, Snail, Wine, Cake, Apple, Croissant, Pizza } from 'lucide-react';
import api, { getAllFoods } from '../services/api';
import { readSessionStorageJson, writeSessionStorageJson } from '../services/menuCache';
import { useCart } from '../context/CartContext';
import { useCartUI } from '../context/CartUIContext';
import { resolveImageUrl, handleImageError } from '../utils/placeholderImage';
import FoodCard from '../components/FoodCard';
import './Menu.css';
import SEO from '../components/SEO';

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

const MENU_CACHE_KEY = 'delivo_menu_cache_v1';

const Menu = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [loading, setLoading] = useState(() => {
    try {
      const cached = readSessionStorageJson(MENU_CACHE_KEY);
      return !cached?.foods?.length;
    } catch {
      return true;
    }
  });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const { addItem, getCartItems } = useCart();
  const { openCart } = useCartUI();

  const categoryData = [
    { _id: 'all', name: 'All', icon: null },
    ...categoriesList,
    { _id: 'combinations', name: 'Combinations', icon: 'Pizza' }
  ];

  useEffect(() => {
    const cachedMenu = readSessionStorageJson(MENU_CACHE_KEY);

    if (cachedMenu?.foods?.length) {
      const cachedFoods = cachedMenu.foods || [];
      const cachedCategories = cachedMenu.categories || [];
      setFoods(cachedFoods);
      setCategoriesList(cachedCategories);
      setFilteredFoods(cachedFoods);
      setError(null);
      setLoading(false);
    }

    fetchMenuData();
  }, []);

  useEffect(() => {
    const searchParam = searchParams.get('search') || '';
    const categoryParam = searchParams.get('category') || 'All';
    setSearchTerm(searchParam);
    setSelectedCategory(categoryParam);
    filterFoods(searchParam, categoryParam, foods);
  }, [searchParams, foods]);

  const fetchMenuData = async () => {
    try {
      const [categoriesRes, foodsResponse, combosRes] = await Promise.all([
        api.get('/categories').then((res) => res.data.data || []).catch((err) => {
          console.error('Error fetching categories in Menu:', err);
          return [];
        }),
        getAllFoods(),
        api.get('/combinations').then((res) => res.data.data || []).catch((err) => {
          console.error('Error fetching combinations for Menu page:', err);
          return [];
        }),
      ]);

      const combosData = (combosRes || []).map((c) => {
        let price = c.price;
        if (price == null || price === 0) {
          price = (c.components || []).reduce((sum, comp) => {
            const unitPrice = comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || 0);
            return sum + unitPrice * (comp.defaultQuantity || 1);
          }, 0);
        }
        return {
          ...c,
          price,
          isCombination: true,
          category: 'Combinations',
        };
      });

      const merged = [...(foodsResponse || []), ...combosData];
      const randomized = merged.sort(() => Math.random() - 0.5);
      setFoods(randomized);
      setCategoriesList(categoriesRes || []);
      const searchParam = searchParams.get('search') || '';
      const categoryParam = searchParams.get('category') || 'All';
      setSearchTerm(searchParam);
      setSelectedCategory(categoryParam);
      setFilteredFoods(randomized);
      filterFoods(searchParam, categoryParam, randomized);
      setError(null);
      writeSessionStorageJson(MENU_CACHE_KEY, {
        foods: randomized,
        categories: categoriesRes || [],
      });
    } catch (err) {
      console.error('Error fetching menu data:', err);
      setError('Failed to load foods');
    } finally {
      setLoading(false);
    }
  };

  const normalizeText = (text) => text?.toString().trim().toLowerCase() || '';

  const handleSearch = (e) => {
    const term = e.target.value;
    const normalizedTerm = normalizeText(term);
    setSearchTerm(term);
    filterFoods(normalizedTerm, selectedCategory);

    // Generate real-time suggestions
    if (normalizedTerm.length > 0) {
      const queryWords = normalizedTerm.split(/\s+/).filter(Boolean);
      const filtered = foods.filter((food) => {
        const nameWords = (food.name || '').toLowerCase().split(/\s+/).filter(Boolean);
        const descriptionWords = (food.description || '').toLowerCase().split(/\s+/).filter(Boolean);

        return queryWords.every((queryWord) => {
          return (
            nameWords.some((word) => word.startsWith(queryWord)) ||
            descriptionWords.some((word) => word.startsWith(queryWord))
          );
        });
      });
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

  const filterFoods = (search, category, listToFilter = foods) => {
    let filtered = listToFilter;
    const normalizedSearch = search?.toString().toLowerCase().trim() || '';

    if (category && category !== 'All') {
      filtered = filtered.filter((food) => {
        if (food.category === category) return true;
        if (food.categories && Array.isArray(food.categories)) {
          return food.categories.some(cat => 
            (typeof cat === 'object' ? cat.name : cat) === category
          );
        }
        return false;
      });
    }

    if (normalizedSearch) {
      const searchWords = normalizedSearch.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((food) => {
        const haystack = `${food.name || ''} ${food.description || ''}`.toLowerCase();
        return searchWords.every((word) => haystack.includes(word));
      });
    }

    setFilteredFoods(filtered);
  };

  const handleFoodClick = (food) => {
    navigate(`/food/${food._id}`);
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

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://delivo.co.ke"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": selectedCategory !== 'All' ? `Menu - ${selectedCategory}` : "Menu",
        "item": `https://delivo.co.ke/menu${selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : ''}`
      }
    ]
  };

  return (
    <div className="menu-container">
      <SEO
        title={selectedCategory !== 'All' ? `Explore ${selectedCategory}` : "Our Menu"}
        description={selectedCategory !== 'All' ? `Browse and order delicious ${selectedCategory} dishes online on Delivo. Lightning-fast delivery to your doorstep.` : "Explore the complete menu of delicious meals and fresh culinary selections on Delivo. Fast, on-demand local delivery."}
        schema={breadcrumbSchema}
      />
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
                  onMouseDown={() => handleSelectSuggestion(food)}
                  onTouchStart={() => handleSelectSuggestion(food)}
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
          const IconComponent = category.icon ? iconMap[category.icon] || Utensils : null;
          return (
            <button
              key={category._id || category.name}
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
            <FoodCard key={food._id} food={food} showVendor={false} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Menu;
