import {useState, useEffect} from 'react';
import { Clock, Zap, Star, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCartUI } from '../context/CartUIContext';
import "./Home.css";
import heroImage from '../assets/hero.png';

import FeaturedRestaurants from "../components/RestaurantCard";
import Categories from "../components/Categories";
import TrendingFoods from "../components/TrendingFoods";
import HowItWorks from "../components/HowItWorks";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour countdown
  const navigate = useNavigate();
  const { openCart } = useCartUI();

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
    {
      id: 1,
      title: "Free Delivery Week",
      discount: "FREE",
      minOrder: "All restaurants",
      buttonText: "Claim Offer",
      body: "Enjoy free delivery on all participating restaurants this week — no code needed."
    },
    {
      id: 2,
      title: "Lunch Combo Deals",
      discount: "30% OFF",
      minOrder: "KES 50+",
      buttonText: "Get Lunch",
      body: "Curated lunch combos to power your day — available 11am–3pm.",
    },
    {
      id: 3,
      title: "Refer & Earn",
      discount: "KES 200",
      minOrder: "Invite a friend",
      buttonText: "Refer Now",
      body: "Invite friends to Delivo and earn KES 200 for every successful referral."
    },
  ];

  // Auto-advance promotions every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePromoIndex(prev => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promos.length]);

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
      {/* ===== Promotions Carousel (re-added) ===== */}
      <section className="promotions-section">
        <div className="promotions-container">
          <div className="promo-card active">
            <div className="promo-content">
              <h3 className="promo-title">{promos[activePromoIndex].title}</h3>
              <p className="promo-subtitle">Minimum order: {promos[activePromoIndex].minOrder}</p>
            </div>
            <div className="promo-badge">{promos[activePromoIndex].discount}</div>
            <button className="promo-btn" onClick={handleOrderNow}>{promos[activePromoIndex].buttonText}</button>
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

      {/* promotions carousel removed per design request */}
      {/* ===== 3. CATEGORIES BROWSER ===== */}
      <Categories onSelectCategory={handleCategorySelect} selectedCategory={selectedCategory} />

      {/* ===== 4. FLASH DEALS SECTION ===== */}
      <section className="flash-deals-section">
        <div className="section-inner full-width-section">
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
        <div className="section-inner full-width-section">
          <h2 className="section-title">Fresh Picks for Tonight</h2>
          <p className="section-subtitle">Curated favourites and comfort meals ready to order</p>
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
            <h4>Delivo</h4>
            <p>Fast food delivery.</p>
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