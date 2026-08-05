import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Flame, Package } from 'lucide-react';
import api from '../../services/api';
import MarketplaceProductCard from '../../components/marketplace/MarketplaceProductCard';
import MarketplaceFooter from '../../components/marketplace/MarketplaceFooter';

const MARKETPLACE_CATEGORIES = [
  { id: 'supermarket', name: 'Supermarket' },
  { id: 'groceries', name: 'Groceries' },
  { id: 'pharmacy', name: 'Pharmacy' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
];

export default function MarketplaceHome() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketplaceProducts();
  }, []);

  const fetchMarketplaceProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/marketplace/products').then((r) => r.data.data || []).catch(() => []);
      let items = res;

      if (!items || items.length === 0) {
        items = [
          {
            _id: 'mkt_1',
            name: 'Organic Whole Milk 1L',
            brand: 'Fresha Dairy',
            category: 'supermarket',
            price: 150,
            originalPrice: 180,
            discountPercent: 17,
            image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80',
            rating: '4.9',
            stock: 45,
          },
          {
            _id: 'mkt_2',
            name: 'Wireless Bluetooth Earbuds Pro',
            brand: 'TechPulse Audio',
            category: 'electronics',
            price: 2499,
            originalPrice: 3200,
            discountPercent: 22,
            image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
            rating: '4.8',
            stock: 12,
          },
          {
            _id: 'mkt_3',
            name: 'Hydrating Facial Serum 50ml',
            brand: 'GlowSkin Organics',
            category: 'beauty',
            price: 1200,
            originalPrice: 1500,
            discountPercent: 20,
            image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
            rating: '4.7',
            stock: 30,
          },
          {
            _id: 'mkt_4',
            name: 'Multivitamin Complex 60s',
            brand: 'HealthPlus Pharmacy',
            category: 'pharmacy',
            price: 850,
            image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
            rating: '4.9',
            stock: 60,
          },
          {
            _id: 'mkt_5',
            name: 'Fresh Crisp Apples (1kg)',
            brand: 'Highland Farms',
            category: 'groceries',
            price: 320,
            image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
            rating: '4.8',
            stock: 50,
          },
          {
            _id: 'mkt_6',
            name: 'Classic Cotton Denim Jacket',
            brand: 'UrbanWear Kenya',
            category: 'fashion',
            price: 2800,
            originalPrice: 3500,
            discountPercent: 20,
            image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
            rating: '4.6',
            stock: 15,
          },
        ];
      }

      setProducts(items);
      setFlashDeals(items.filter((i) => i.discountPercent > 0 || i.originalPrice > i.price));
    } catch (err) {
      console.error('Error fetching marketplace items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleQuickSearch = (catName) => {
    setSelectedCategory(selectedCategory === catName ? null : catName);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedCategory || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchInput.trim() ||
      p.name?.toLowerCase().includes(searchInput.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchInput.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="home-wrapper">
      {/* ===== SEARCH HERO ===== */}
      <section className="hero-search-section">
        <div className="hero-search-inner">
          <div className="hero-search-wrapper">
            <form onSubmit={handleSearchSubmit} className="hero-search-form">
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
              {MARKETPLACE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`shortcut-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => handleQuickSearch(cat.id)}
                  type="button"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FLASH DEALS SECTION ===== */}
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
            {Array.from({ length: 6 }).map((_, i) => (
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
    </div>
  );
}
