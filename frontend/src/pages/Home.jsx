import React, { useState, useEffect } from "react";
import { Search, MapPin, ArrowRight, Clock, Zap, Star, Flame, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

import FeaturedRestaurants from "../components/RestaurantCard";
import Categories from "../components/Categories";
import TrendingFoods from "../components/TrendingFoods";
import HowItWorks from "../components/HowItWorks";

export default function Home() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour countdown
  const navigate = useNavigate();

  // Countdown timer for flash deals
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const promos = [
    { id: 1, title: "50% OFF on First Order", discount: "50%", minOrder: "$10", buttonText: "Order Now" },
    { id: 2, title: "Free Delivery on Orders Above $30", discount: "FREE", minOrder: "$30+", buttonText: "Shop Now" },
    { id: 3, title: "Double Points Weekend", discount: "2x", minOrder: "All orders", buttonText: "Learn More" },
  ];

  const handleFindFood = () => {
    if (searchTerm.trim()) {
      const trendingSection = document.querySelector('.popular-meals-section');
      if (trendingSection) {
        trendingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleOrderNow = () => {
    navigate('/menu');
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    setTimeout(() => {
      const trendingSection = document.querySelector('.popular-meals-section');
      if (trendingSection) {
        trendingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleClearFilter = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="home-wrapper">
      {/* ===== 1. HERO SECTION ===== */}
      <section className="hero-section">
        <div className="hero-bg-blob blob-1"></div>
        <div className="hero-bg-blob blob-2"></div>

        <div className="hero-container">
          <div className="hero-left">
            <h1 className="hero-headline">
              Delicious food <br />
              delivered to your <br />
              <span className="gradient-text">door.</span>
            </h1>

            <p className="hero-subtext">
              Order from your favorite restaurants, stores, and local chefs in minutes.
            </p>

            <div className={`hero-search-bar ${isSearchFocused ? "focused" : ""}`}>
              <MapPin size={22} className="search-icon" />
              <input
                type="text"
                placeholder="Search for restaurants, meals or cuisines..."
                className="hero-input"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFindFood()}
              />
              <button className="hero-search-btn" onClick={handleFindFood}>
                <Search size={20} />
              </button>
            </div>

            <div className="hero-cta-group">
              <button className="btn-primary" onClick={handleOrderNow}>
                Order Now <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="hero-right">
            <div className="showcase-scene">
              <div className="shadow-floor"></div>
              <div className="floating-item food-pizza placeholder-item">
                <span>Pizza</span>
              </div>
              <div className="floating-item food-burger placeholder-item">
                <span>Burger</span>
              </div>
              <div className="floating-item food-fries placeholder-item">
                <span>Fries</span>
              </div>
              <div className="floating-item food-drink placeholder-item">
                <span>Drink</span>
              </div>
              <div className="accent-circle circle-gold"></div>
              <div className="accent-circle circle-orange"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. PROMOTIONS CAROUSEL ===== */}
      <section className="promotions-section">
        <div className="promotions-container">
          <div className="promo-card active">
            <div className="promo-content">
              <h3 className="promo-title">{promos[activePromoIndex].title}</h3>
              <p className="promo-subtitle">Minimum order: {promos[activePromoIndex].minOrder}</p>
            </div>
            <div className="promo-badge">{promos[activePromoIndex].discount}</div>
            <button className="promo-btn">{promos[activePromoIndex].buttonText}</button>
          </div>

          <div className="promo-indicators">
            {promos.map((_, idx) => (
              <div
                key={idx}
                className={`indicator ${idx === activePromoIndex ? 'active' : ''}`}
                onClick={() => setActivePromoIndex(idx)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3. CATEGORIES BROWSER ===== */}
      <Categories onSelectCategory={handleCategorySelect} selectedCategory={selectedCategory} />

      {/* ===== 4. FLASH DEALS SECTION ===== */}
      <section className="flash-deals-section">
        <div className="flash-header">
          <div className="flash-title">
            <Flame size={28} className="flame-icon" />
            <h2>Crave-Worthy Flash Deals</h2>
          </div>
          <div className="countdown-timer">
            <Clock size={20} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
        <TrendingFoods searchTerm={searchTerm} selectedCategory={selectedCategory} onClearFilter={handleClearFilter} isFlashDeal={true} />
      </section>

      {/* ===== 5. POPULAR ITEMS GRID ===== */}
      <section className="popular-meals-section">
        <h2 className="section-title">Popular Near You</h2>
        <p className="section-subtitle">Most ordered meals in your area</p>
        <TrendingFoods searchTerm={searchTerm} selectedCategory={selectedCategory} onClearFilter={handleClearFilter} />
      </section>

      {/* ===== 6. POPULAR RESTAURANTS ===== */}
      <FeaturedRestaurants />

      {/* ===== 7. HOW IT WORKS STEPPER ===== */}
      <HowItWorks />

      {/* ===== 8. CORPORATE BANNER ===== */}
      <section className="corporate-banner">
        <div className="corporate-content">
          <div className="corporate-left">
            <h2>Ordering for Your Team?</h2>
            <p>Set up a corporate account and get exclusive benefits for your business</p>
            <button className="corporate-btn">Setup Corporate Account</button>
          </div>
          <div className="corporate-right">
            <Truck size={80} className="corporate-icon" />
          </div>
        </div>
      </section>

      {/* ===== 9. FOOTER ===== */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-column">
            <h4>About Delivo</h4>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#press">Press</a></li>
              <li><a href="#blog">Blog</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>For Customers</h4>
            <ul>
              <li><a href="#help">Help Center</a></li>
              <li><a href="#account">Account Settings</a></li>
              <li><a href="#orders">My Orders</a></li>
              <li><a href="#favorites">Favorites</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>For Partners</h4>
            <ul>
              <li><a href="#restaurant">Restaurant Signup</a></li>
              <li><a href="#delivery">Delivery Partner</a></li>
              <li><a href="#merchant">Merchant Center</a></li>
              <li><a href="#support">Partner Support</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#cookies">Cookie Policy</a></li>
              <li><a href="#contact">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-apps">
          <h4>Download Our App</h4>
          <div className="app-links">
            <a href="#ios" className="app-store">App Store</a>
            <a href="#android" className="app-store">Google Play</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 Delivo. All rights reserved.</p>
          <div className="social-links">
            <a href="#fb">Facebook</a>
            <a href="#tw">Twitter</a>
            <a href="#ig">Instagram</a>
            <a href="#linked">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}