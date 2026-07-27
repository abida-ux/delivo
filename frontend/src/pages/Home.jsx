import { useState, useEffect } from 'react';
import { 
  Clock, 
  Zap, 
  Star, 
  Flame, 
  Search, 
  Check, 
  Copy, 
  Smartphone,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartUI } from '../context/CartUIContext';
import api from '../services/api';
import './Home.css';

// Import our new premium high-resolution dining table image
import heroDiningTable from '../assets/hero_dining_table.png';

import FeaturedRestaurants from "../components/RestaurantCard";
import Categories from "../components/Categories";
import TrendingFoods from "../components/TrendingFoods";
import HowItWorks from "../components/HowItWorks";
import ComboMealsSection from "../components/ComboMealsSection";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
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

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

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
    setSearchTerm("");
    setSearchInput("");
  };


  return (
    <div className="home-wrapper">
      {/* ===== 1. PREMIUM STATIC HERO SECTION ===== */}
      <section 
        className="hero-static-section"
        style={{ 
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.85) 30%, rgba(0, 0, 0, 0.45) 70%), url(${heroDiningTable})` 
        }}
      >
        <div className="hero-static-inner">
          <div className="hero-static-content">
            <span className="hero-static-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} />
              Welcome to Delivo
            </span>
            <h1 className="hero-static-title">Crave It? We Crate It.</h1>
            <p className="hero-static-desc">
              Get premium curated meals, fresh ingredients, and local culinary highlights delivered straight to your doorstep in minutes.
            </p>
            
            {/* Integrated Search Bar inside Hero */}
            <div className="hero-search-wrapper">
              <form onSubmit={handleSearchSubmit} className="hero-search-form">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search for meals, cuisines, or local kitchens..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" className="hero-search-btn">Find Food</button>
              </form>
              <div className="hero-search-shortcuts">
                <span className="shortcut-label">Popular searches:</span>
                {popularCategories.map((cat) => (
                  <button 
                    key={cat} 
                    className="shortcut-pill" 
                    onClick={() => handleQuickSearch(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. CATEGORIES BROWSER ===== */}
      <Categories onSelectCategory={handleCategorySelect} selectedCategory={selectedCategory} />

      {/* ===== 3. FLASH DEALS SECTION ===== */}
      <section className="flash-deals-section">
        <div className="section-inner full-width-section">
          <div className="flash-header">
            <div className="flash-title">
              <Flame size={28} className="flame-icon" />
              <h2>Crave-Worthy Flash Deals</h2>
            </div>
          </div>
          <TrendingFoods searchTerm={searchTerm} selectedCategory={selectedCategory} onClearFilter={handleClearFilter} isFlashDeal={true} />
        </div>
      </section>



      {/* ===== 5. POPULAR ITEMS GRID ===== */}
      <section className="popular-meals-section">
        <div className="section-inner full-width-section">
          <h2 className="section-title">Fresh Picks for Tonight</h2>
          <p className="section-subtitle">Curated favourites and comfort meals ready to order</p>
          <TrendingFoods searchTerm={searchTerm} selectedCategory={selectedCategory} onClearFilter={handleClearFilter} />
        </div>
      </section>

      {/* ===== COMBO MEALS SECTION ===== */}
      <ComboMealsSection />

      {/* ===== 6. POPULAR RESTAURANTS ===== */}
      <FeaturedRestaurants />

      {/* ===== 7. HOW IT WORKS STEPPER ===== */}
      <HowItWorks />



      {/* ===== 9. FOOTER ===== */}
      <footer className="footer">
        <div className="footer-content simplified-footer">
          <div className="footer-column">
            <h4>Delivo</h4>
            <p>Fast food delivery, premium curation.</p>
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
          <p>&copy; 2026 Delivo.</p>
        </div>
      </footer>
    </div>
  );
}