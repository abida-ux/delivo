import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Flame, Package } from 'lucide-react';
import { getMarketplaceCategories, getMarketplaceProducts, getMarketplaceBanners } from '../../services/api';
import MarketplaceProductCard from '../../components/marketplace/MarketplaceProductCard';
import MarketplaceFooter from '../../components/marketplace/MarketplaceFooter';
import { LoaderContext } from '../../context/LoaderContext';
import ReturnToFoodModal from '../../components/marketplace/ReturnToFoodModal';

export default function MarketplaceHome() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const { showLoader, hideLoader } = useContext(LoaderContext);

  // Typewriter effect states (Marketplace first / vice versa)
  const [typedText, setTypedText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const phrases = ["More Than Just Food", "Delivered in Minutes"];

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

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [catsRes, productsRes, bannersRes] = await Promise.all([
        getMarketplaceCategories().catch(() => []),
        getMarketplaceProducts({ limit: 40 }).catch(() => ({ data: [] })),
        getMarketplaceBanners().catch(() => []),
      ]);

      setCategories(catsRes || []);
      setBanners(bannersRes || []);
      const items = productsRes.data || [];
      setProducts(items);
      setFlashDeals(items.filter((i) => i.flashSale || i.discount > 0 || i.discountPrice > 0));
    } catch (err) {
      console.error('Error fetching marketplace home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleQuickSearch = (catType) => {
    setSelectedCategory(selectedCategory === catType ? null : catType);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedCategory || p.categoryType === selectedCategory || p.category?.categoryType === selectedCategory;
    const matchesSearch =
      !searchInput.trim() ||
      p.name?.toLowerCase().includes(searchInput.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchInput.toLowerCase()) ||
      p.store?.toLowerCase().includes(searchInput.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="home-wrapper">
      {/* ===== SEARCH HERO ===== */}
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

            {/* Headline and subtitle matching the reference with typewriter effect (vice versa) */}
            <h1 className="app-headline">
              {phraseIndex === 0 ? 'Delivo,' : 'Your Cravings,'}<br />
              <span className="highlight-app">
                {typedText}
                <span className="typewriter-cursor">|</span>
              </span>
            </h1>
            <p className="app-subparagraph">
              {phraseIndex === 0 
                ? "Shop from local pharmacies, supermarkets, and local shops. Get everyday essentials delivered right to your doorstep."
                : "Order from top local restaurants and discover new flavors with lightning-fast delivery. Seamless dining from your home."}
            </p>

            {/* Dynamic Single Button changing based on typewriter text */}
            <div className="app-button-group">
              <button 
                className="btn-app-primary dynamic-view-btn" 
                onClick={() => {
                  if (phraseIndex === 1) {
                    setShowReturnModal(true);
                  } else {
                    const element = document.querySelector('.hero-search-shortcuts');
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                {phraseIndex === 0 ? 'View Marketplace' : 'View Menu'}
              </button>
            </div>

          </div>

          {/* SEARCH BAR (Directly below the container card, styled to match the warm app-like theme) */}
          <div className="hero-search-wrapper">
            <form onSubmit={handleSearchSubmit} className="hero-search-form app-themed-search">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search products, brands and shops..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search for products"
              />
              <button type="submit" className="hero-search-btn">Search</button>
            </form>

            <div className="hero-search-shortcuts">
              <span className="shortcut-label">Categories:</span>
              {(categories.length > 0 ? categories : [
                { categoryType: 'supermarket', name: 'Supermarket' },
                { categoryType: 'groceries', name: 'Groceries' },
                { categoryType: 'pharmacy', name: 'Pharmacy' },
                { categoryType: 'electronics', name: 'Electronics' },
                { categoryType: 'fashion', name: 'Fashion' },
              ]).map((cat) => (
                <button
                  key={cat._id || cat.categoryType}
                  className={`shortcut-pill ${selectedCategory === cat.categoryType ? 'active' : ''}`}
                  onClick={() => handleQuickSearch(cat.categoryType)}
                  type="button"
                >
                  {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HERO BANNERS (IF AVAILABLE) ===== */}
      {banners.length > 0 && !selectedCategory && !searchInput && (
        <section style={{ maxWidth: 1240, margin: '0 auto 24px', padding: '0 16px' }}>
          <div style={{ borderRadius: 20, overflow: 'hidden', background: '#0f172a', color: '#fff', padding: '32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>{banners[0].title}</h2>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 16px' }}>{banners[0].subtitle}</p>
              <button className="hero-search-btn" onClick={() => navigate(banners[0].buttonLink || '/marketplace/categories')}>
                {banners[0].buttonText || 'Shop Now'}
              </button>
            </div>
            {banners[0].desktopBanner && (
              <img src={banners[0].desktopBanner} alt="Banner" style={{ width: 260, height: 140, objectFit: 'cover', borderRadius: 14 }} />
            )}
          </div>
        </section>
      )}

      {/* ===== FLASH SALES SECTION ===== */}
      {flashDeals.length > 0 && !selectedCategory && !searchInput && (
        <section className="flash-deals-section">
          <div className="flash-header">
            <div className="flash-title">
              <Flame size={20} className="flame-icon" />
              <h2>Flash Sales</h2>
            </div>
          </div>
          <div className="foods-grid">
            {flashDeals.map((product) => (
              <MarketplaceProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ===== MARKETPLACE CATALOG SECTION ===== */}
      <section className="popular-meals-section">
        <div className="flash-header">
          <div className="flash-title">
            <h2>
              {selectedCategory
                ? `${selectedCategory.toUpperCase()} Products`
                : 'Marketplace Picks'}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="foods-grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="food-menu-card" style={{ height: 260, opacity: 0.6 }} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Package size={40} style={{ color: 'var(--color-orange)', marginBottom: 12 }} />
            <h3>No products found</h3>
            <p>Try searching for a different keyword or category.</p>
          </div>
        ) : (
          <div className="foods-grid">
            {filteredProducts.map((product) => (
              <MarketplaceProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ===== FOOTER ===== */}
      <MarketplaceFooter />
      <ReturnToFoodModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onConfirm={() => {
          setShowReturnModal(false);
          showLoader();
          navigate('/');
          setTimeout(() => {
            hideLoader();
          }, 1500);
        }}
      />
    </div>
  );
}
