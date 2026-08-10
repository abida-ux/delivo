import { useState, useEffect, useRef, useContext } from 'react';
import { 
  Search, 
  Flame, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  Star, 
  UtensilsCrossed, 
  Store, 
  ArrowRight,
  Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartUI } from '../context/CartUIContext';
import { LoaderContext } from '../context/LoaderContext';
import MarketplaceConfirmationModal from '../components/marketplace/MarketplaceConfirmationModal';
import './Home.css';
import SEO from '../components/SEO';

import FeaturedRestaurants from "../components/RestaurantCard";
import Categories from "../components/Categories";
import TrendingFoods from "../components/TrendingFoods";
import HowItWorks from "../components/HowItWorks";
import ComboMealsSection from "../components/ComboMealsSection";
import { getActiveFoodFlashSales } from '../services/api';

const UpcomingFlashCountdown = ({ startAt, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(startAt) - new Date();
      if (difference <= 0) {
        setTimeLeft('Starting...');
        if (onFinish) {
          setTimeout(() => onFinish(), 1000);
        }
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const formatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
      setTimeLeft(formatted);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [startAt, onFinish]);

  return (
    <div className="upcoming-countdown-timer">
      {timeLeft}
    </div>
  );
};

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [popularCategories, setPopularCategories] = useState(['Pizza', 'Drinks', 'Healthy', 'Desserts']);
  const [flashState, setFlashState] = useState({ hasActive: false, activeDeals: [], upcoming: null });
  
  // Typewriter effect states
  const [typedText, setTypedText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const phrases = ["Delivered in Minutes", "More Than Just Food"];

  useEffect(() => {
    let timer;
    const currentPhrase = phrases[phraseIndex];

    if (!isDeleting) {
      // Typing character-by-character
      timer = setTimeout(() => {
        setTypedText(currentPhrase.substring(0, typedText.length + 1));
      }, 80);

      if (typedText === currentPhrase) {
        // Pause at full word before deleting
        timer = setTimeout(() => setIsDeleting(true), 2500);
      }
    } else {
      // Deleting character-by-character
      timer = setTimeout(() => {
        setTypedText(currentPhrase.substring(0, typedText.length - 1));
      }, 40);

      if (typedText === "") {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, phraseIndex]);

  const fetchFlashSales = async () => {
    try {
      const res = await getActiveFoodFlashSales();
      setFlashState({
        hasActive: res.data && res.data.length > 0,
        activeDeals: res.data || [],
        upcoming: res.upcoming || null
      });
    } catch (err) {
      console.error('Error fetching flash sales on home:', err);
    }
  };

  useEffect(() => {
    fetchFlashSales();
    const interval = setInterval(fetchFlashSales, 15000);
    return () => clearInterval(interval);
  }, []);
  
  // Autocomplete search states
  const [allFoods, setAllFoods] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const { showLoader, hideLoader } = useContext(LoaderContext);
  
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();
  const { openCart } = useCartUI();

  // Load search datasets (foods and restaurants) on mount
  useEffect(() => {
    const loadSearchData = async () => {
      try {
        const { getAllFoods, getAllRestaurants } = await import('../services/api');
        const [foodsList, restaurantsList] = await Promise.all([
          getAllFoods(),
          getAllRestaurants()
        ]);
        setAllFoods(foodsList);
        setAllRestaurants(restaurantsList);

        // Fetch real categories dynamically from foods in the database
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
        console.error('Failed to load data for search autocomplete:', error);
      }
    };
    loadSearchData();
  }, []);

  // Click outside listener to dismiss the search suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setShowDropdown(false);
      navigate(`/menu?search=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (val.trim().length > 1) {
      const query = val.toLowerCase();
      
      const matchedFoods = allFoods.filter(food =>
        food.name.toLowerCase().includes(query) ||
        (food.category && food.category.toLowerCase().includes(query))
      ).slice(0, 5);

      const matchedRestaurants = allRestaurants.filter(rest =>
        rest.name.toLowerCase().includes(query) ||
        (rest.cuisine && rest.cuisine.toLowerCase().includes(query))
      ).slice(0, 3);

      setFilteredFoods(matchedFoods);
      setFilteredRestaurants(matchedRestaurants);
      setShowDropdown(true);
    } else {
      setFilteredFoods([]);
      setFilteredRestaurants([]);
      setShowDropdown(false);
    }
  };

  const handleQuickSearch = (term) => {
    setSearchInput(term);
    setShowDropdown(false);
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

  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Delivo",
      "url": "https://delivo.co.ke",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://delivo.co.ke/menu?search={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Delivo",
      "url": "https://delivo.co.ke",
      "logo": "https://delivo.co.ke/delivo.jpg"
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Delivo",
      "url": "https://delivo.co.ke",
      "applicationCategory": "ShoppingApplication",
      "operatingSystem": "All"
    }
  ];

  return (
    <div className="home-wrapper">
      <SEO
        title="Order Food Online"
        description="Order from your favorite restaurants and local shops with Delivo. Enjoy premium, lightning-fast delivery of gourmet meals and everyday essentials."
        schema={schemas}
      />
      <section className="hero-search-section">
        <div className="hero-search-inner">
          
          {/* Centered App Container Card */}
          <div className="hero-app-card">
            
            {/* Delivo Logo brand tag matching the reference */}
            <div className="app-logo-wrap">
              <img src="/delivo.jpg" alt="Delivo Logo" className="app-logo-image" />
              <span className="app-logo-brand">Delivo</span>
            </div>

            {/* Badge below logo */}
            <div className="app-fast-delivery-badge">
              <span>FASTEST DELIVERY</span>
            </div>

            {/* Headline and subtitle matching the reference with typewriter effect */}
            <h1 className="app-headline">
              {phraseIndex === 0 ? 'Your Cravings,' : 'Delivo,'}<br />
              <span className="highlight-app">
                {typedText}
                <span className="typewriter-cursor">|</span>
              </span>
            </h1>
            <p className="app-subparagraph">
              {phraseIndex === 0 
                ? "Order from top local restaurants and discover new flavors with lightning-fast delivery. Seamless dining from your home."
                : "Shop from local pharmacies, supermarkets, and local shops. Get everyday essentials delivered right to your doorstep."}
            </p>

            {/* Dynamic Single Button changing based on typewriter text */}
            <div className="app-button-group">
              <button 
                className="btn-app-primary dynamic-view-btn" 
                onClick={() => {
                  if (phraseIndex === 1) {
                    setShowMarketplaceModal(true);
                  } else {
                    navigate('/menu');
                  }
                }}
              >
                {phraseIndex === 0 ? 'View Menu' : 'View Marketplace'}
              </button>
            </div>

          </div>

          {/* SEARCH BAR (Directly below the container card, styled to match the warm app-like theme) */}
          <div className="hero-search-wrapper" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="hero-search-form app-themed-search">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search for your favorite dish..."
                value={searchInput}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchInput.trim().length > 1) setShowDropdown(true);
                }}
                aria-label="Search for food"
              />
              <button type="submit" className="hero-search-btn">Search</button>
            </form>

            {showDropdown && (filteredFoods.length > 0 || filteredRestaurants.length > 0) && (
              <div className="search-autocomplete-dropdown">
                {filteredFoods.length > 0 && (
                  <div className="autocomplete-section">
                    <h4 className="autocomplete-section-title">Meals</h4>
                    <div className="autocomplete-items">
                      {filteredFoods.map((food) => (
                        <div
                          key={food._id}
                          className="autocomplete-item"
                          onClick={() => {
                            setShowDropdown(false);
                            navigate(`/food/${food._id}`);
                          }}
                        >
                          <img
                            src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=60'}
                            alt={food.name}
                            className="autocomplete-item-img"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=60';
                            }}
                          />
                          <div className="autocomplete-item-details">
                            <span className="autocomplete-item-name">{food.name}</span>
                            <span className="autocomplete-item-category">{food.category}</span>
                          </div>
                          <span className="autocomplete-item-price">KSh {food.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredRestaurants.length > 0 && (
                  <div className="autocomplete-section">
                    <h4 className="autocomplete-section-title">Restaurants</h4>
                    <div className="autocomplete-items">
                      {filteredRestaurants.map((restaurant) => (
                        <div
                          key={restaurant._id}
                          className="autocomplete-item"
                          onClick={() => {
                            setShowDropdown(false);
                            navigate(`/restaurants/${restaurant._id}`);
                          }}
                        >
                          <div className="autocomplete-item-details">
                            <span className="autocomplete-item-name">{restaurant.name}</span>
                            <span className="autocomplete-item-category">{restaurant.cuisine || 'Kitchen'}</span>
                          </div>
                          <span className="autocomplete-go-text">View →</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <Categories onSelectCategory={handleCategorySelect} selectedCategory={selectedCategory} />

      {/* ===== FLASH DEALS ===== */}
      {(flashState.hasActive || flashState.upcoming) && (
        <section className="flash-deals-section" style={{ background: 'transparent', padding: '12px 0' }}>
          {flashState.hasActive ? (
            <TrendingFoods
              title="Flash Deals"
              icon={<Flame size={20} className="flame-icon" />}
              searchTerm=""
              selectedCategory={selectedCategory}
              onClearFilter={handleClearFilter}
              isFlashDeal={true}
              flashItems={flashState.activeDeals}
              onExpired={fetchFlashSales}
            />
          ) : (
            <>
              <div className="flash-header" style={{ padding: '0 var(--space-2)' }}>
                <div className="flash-title">
                  <Flame size={20} className="flame-icon" />
                  <h2>Flash Deals</h2>
                </div>
              </div>
              <div className="upcoming-flash-banner">
                <h3>Next Flash Sale</h3>
                <p className="upcoming-sub">Starts in</p>
                <UpcomingFlashCountdown startAt={flashState.upcoming.startAt} onFinish={fetchFlashSales} />
                <p className="upcoming-promo">Get ready for limited-time deals.</p>
              </div>
            </>
          )}
        </section>
      )}

      {/* ===== FEATURED RESTAURANTS ===== */}
      <FeaturedRestaurants />

      {/* ===== COMBO MEALS ===== */}
      <ComboMealsSection />

      {/* ===== POPULAR PICKS ===== */}
      <section className="popular-meals-section" style={{ background: 'transparent', padding: '12px 0' }}>
        <TrendingFoods
          title="Fresh Picks for Tonight"
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
      <MarketplaceConfirmationModal
        isOpen={showMarketplaceModal}
        onClose={() => setShowMarketplaceModal(false)}
        onConfirm={() => {
          setShowMarketplaceModal(false);
          showLoader();
          navigate('/marketplace');
          setTimeout(() => {
            hideLoader();
          }, 1500);
        }}
      />
    </div>
  );
}