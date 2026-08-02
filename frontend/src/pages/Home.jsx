import { useState, useEffect } from 'react';
import { Search, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartUI } from '../context/CartUIContext';
import './Home.css';

import FeaturedRestaurants from "../components/RestaurantCard";
import Categories from "../components/Categories";
import TrendingFoods from "../components/TrendingFoods";
import HowItWorks from "../components/HowItWorks";
import ComboMealsSection from "../components/ComboMealsSection";

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [popularCategories, setPopularCategories] = useState(['Pizza', 'Drinks', 'Healthy', 'Desserts']);

  const navigate = useNavigate();
  const { openCart } = useCartUI();

  // Fetch real categories dynamically from foods in the database
  useEffect(() => {
    const fetchRealCategories = async () => {
      try {
        const { getAllFoods } = await import('../services/api');
        const foodsList = await getAllFoods();
        const counts = {};
        foodsList.forEach(food => {
          if (food.category) {
            counts[food.category] = (counts[food.category] || 0) + 1;
          }
        });
        const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        if (sorted.length > 0) {
          setPopularCategories(sorted.slice(0, 4));
        }
      } catch (error) {
        console.error('Failed to load foods for popular search shortcuts:', error);
      }
    };
    fetchRealCategories();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleQuickSearch = (term) => {
    setSearchInput(term);
    navigate(`/menu?search=${encodeURIComponent(term)}`);
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    navigate(`/menu?category=${encodeURIComponent(categoryName)}`);
  };

  const handleClearFilter = () => {
    setSelectedCategory(null);
    setSearchInput("");
  };

  return (
    <div className="home-wrapper">

      {/* ===== SEARCH HERO (compact, Munchify-style) ===== */}
      <section className="hero-search-section">
        <div className="hero-search-inner">
          <div className="hero-search-wrapper">
            <form onSubmit={handleSearchSubmit} className="hero-search-form">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search for meals, cuisines, or local kitchens..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search for food"
              />
              <button type="submit" className="hero-search-btn">Search</button>
            </form>

            <div className="hero-search-shortcuts">
              <span className="shortcut-label">Try:</span>
              {popularCategories.map((cat) => (
                <button
                  key={cat}
                  className="shortcut-pill"
                  onClick={() => handleQuickSearch(cat)}
                  type="button"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <Categories onSelectCategory={handleCategorySelect} selectedCategory={selectedCategory} />

      {/* ===== FLASH DEALS ===== */}
      <section className="flash-deals-section">
        <div className="flash-header">
          <div className="flash-title">
            <Flame size={20} className="flame-icon" />
            <h2>Flash Deals</h2>
          </div>
        </div>
        <TrendingFoods
          searchTerm=""
          selectedCategory={selectedCategory}
          onClearFilter={handleClearFilter}
          isFlashDeal={true}
        />
      </section>

      {/* ===== FEATURED RESTAURANTS ===== */}
      <FeaturedRestaurants />

      {/* ===== COMBO MEALS ===== */}
      <ComboMealsSection />

      {/* ===== POPULAR PICKS ===== */}
      <section className="popular-meals-section">
        <div className="flash-header">
          <div className="flash-title">
            <h2>Fresh Picks for Tonight</h2>
          </div>
        </div>
        <TrendingFoods
          searchTerm=""
          selectedCategory={selectedCategory}
          onClearFilter={handleClearFilter}
        />
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <HowItWorks />

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-content simplified-footer">
          <div className="footer-column">
            <h4>Delivo</h4>
            <p>Premium food delivery, curated for you.</p>
          </div>
          <div className="footer-column">
            <h4>Support</h4>
            <ul>
              <li><a href="mailto:info@delivo.buzz">info@delivo.buzz</a></li>
              <li><a href="tel:+254704060217">+254 704 060 217</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/menu">Menu</a></li>
              <li>
                <button className="footer-link-button" type="button" onClick={openCart}>
                  My Cart
                </button>
              </li>
              <li><a href="/settings">Settings</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Delivo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}