import React, { useState, useEffect, useRef } from "react";
import { Clock, Zap, Star, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

import FeaturedRestaurants from "../components/RestaurantCard";
import Categories from "../components/Categories";
import TrendingFoods from "../components/TrendingFoods";
import HowItWorks from "../components/HowItWorks";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [isPromoPaused, setIsPromoPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour countdown
  const navigate = useNavigate();

  const promos = [
    { id: 1, title: "50% OFF on First Order", discount: "50%", minOrder: "KES 10", buttonText: "Order Now" },
    { id: 2, title: "Free Delivery on Orders Above KES 30", discount: "FREE", minOrder: "KES 30+", buttonText: "Shop Now" },
    { id: 3, title: "Double Points Weekend", discount: "2x", minOrder: "All orders", buttonText: "Learn More" },
  ];

  // Countdown timer for flash deals
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-advance promotions carousel every 3 seconds, pause when hovered
  useEffect(() => {
    if (isPromoPaused) return;
    const slideInterval = setInterval(() => {
      setActivePromoIndex(prev => (prev + 1) % promos.length);
    }, 3000);
    return () => clearInterval(slideInterval);
  }, [promos.length, isPromoPaused]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

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

  const promoTouchStartXRef = useRef(null);
  const promoTouchEndXRef = useRef(null);

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

  const handlePromoTouchStart = (event) => {
    promoTouchStartXRef.current = event.touches[0]?.clientX;
    setIsPromoPaused(true);
  };

  const handlePromoTouchMove = (event) => {
    promoTouchEndXRef.current = event.touches[0]?.clientX;
  };

  const handlePromoTouchEnd = () => {
    const startX = promoTouchStartXRef.current;
    const endX = promoTouchEndXRef.current;
    const minSwipeDistance = 50;

    if (startX != null && endX != null) {
      const deltaX = startX - endX;
      if (deltaX > minSwipeDistance) {
        setActivePromoIndex(prev => (prev + 1) % promos.length);
      } else if (deltaX < -minSwipeDistance) {
        setActivePromoIndex(prev => (prev - 1 + promos.length) % promos.length);
      }
    }

    promoTouchStartXRef.current = null;
    promoTouchEndXRef.current = null;
    setIsPromoPaused(false);
  };

  return (
    <div className="home-wrapper">
      {/* ===== 2. PROMOTIONS CAROUSEL ===== */}
      <section className="promotions-section">
        <div
          className="promotions-container"
          onMouseEnter={() => setIsPromoPaused(true)}
          onMouseLeave={() => setIsPromoPaused(false)}
          onTouchStart={handlePromoTouchStart}
          onTouchMove={handlePromoTouchMove}
          onTouchEnd={handlePromoTouchEnd}
        >
          <div className="promo-viewport">
            <div
              className="promo-track"
              style={{ transform: `translateX(-${activePromoIndex * 100}%)` }}
            >
              {promos.map((promo, idx) => (
                <div key={promo.id} className={`promo-card ${idx === activePromoIndex ? 'active' : ''}`}>
                  <div className="promo-content">
                    <h3 className="promo-title">{promo.title}</h3>
                    <p className="promo-subtitle">Minimum order: {promo.minOrder}</p>
                  </div>
                  <div className="promo-badge">{promo.discount}</div>
                  <button className="promo-btn" onClick={handleOrderNow}>{promo.buttonText}</button>
                </div>
              ))}
            </div>
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
        <div className="section-inner">
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
        </div>
      </section>

      {/* ===== 5. POPULAR ITEMS GRID ===== */}
      <section className="popular-meals-section">
        <div className="section-inner">
          <h2 className="section-title">Popular Near You</h2>
          <p className="section-subtitle">Most ordered meals in your area</p>
          <TrendingFoods searchTerm={searchTerm} selectedCategory={selectedCategory} onClearFilter={handleClearFilter} />
        </div>
      </section>

      {/* ===== 6. POPULAR RESTAURANTS ===== */}
      <FeaturedRestaurants />

      {/* ===== 7. HOW IT WORKS STEPPER ===== */}
      <HowItWorks />

      {/* ===== 8. FOOTER ===== */}
      <footer className="footer">
        <div className="footer-content simplified-footer">
          <div className="footer-column">
            <h4>Delivo Kenya</h4>
            <p>Fast food delivery across Nairobi and beyond.</p>
          </div>
          <div className="footer-column">
            <h4>Support</h4>
            <ul>
              <li><a href="mailto:support@delivo.co.ke">support@delivo.co.ke</a></li>
              <li><a href="tel:+254700000000">+254 700 000 000</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/menu">Menu</a></li>
              <li><a href="/customer/cart">My Cart</a></li>
              <li><a href="/settings">Settings</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Delivo. Built for Kenya.</p>
        </div>
      </footer>
    </div>
  );
}