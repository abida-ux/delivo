import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, ShieldCheck, Sparkles, Package, BadgeCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getMarketplaceCategories, getMarketplaceProducts } from '../../services/api';
import '../pages.css';

const categoryMeta = {
  supermarket: { title: 'Supermarket', description: 'Everyday essentials, household supplies, and pantry staples.' },
  groceries: { title: 'Groceries', description: 'Fresh produce, proteins, and daily kitchen staples.' },
  pharmacy: { title: 'Pharmacy', description: 'Health essentials, first aid, and daily wellness items.' },
  liquor: { title: 'Liquor', description: 'Beer, wine, spirits, and mixers for your next celebration.' },
};

const Marketplace = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeType, setActiveType] = useState('supermarket');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, prodRes] = await Promise.all([
          getMarketplaceCategories(),
          getMarketplaceProducts({ categoryType: activeType, search }),
        ]);
        setCategories(cats);
        setProducts(prodRes.data || []);
      } catch (error) {
        console.error('Error loading marketplace data', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeType, search]);

  const featured = useMemo(() => products.filter((item) => item.featured).slice(0, 3), [products]);

  const handleAddToCart = async (product) => {
    try {
      setAddingId(product._id);
      setFeedback('');
      await addItem({ ...product, productType: 'marketplace' }, 1);
      setFeedback(`${product.name} added to your cart.`);
    } catch (error) {
      console.error('Unable to add marketplace item', error);
      setFeedback('Unable to add this item right now.');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="page-shell" style={{ paddingBottom: '3rem' }}>
      <section className="hero-static-section" style={{ minHeight: '280px', backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 100%), url(https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1400&q=80)' }}>
        <div className="hero-static-inner">
          <div className="hero-static-content">
            <span className="hero-static-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> Multi-category marketplace
            </span>
            <h1 className="hero-static-title">Shop meals, essentials, wellness, and more in one checkout.</h1>
            <p className="hero-static-desc">Browse curated marketplace products with the same fast delivery experience as Delivo meals.</p>
          </div>
        </div>
      </section>

      <div className="section-inner" style={{ marginTop: '1.5rem' }}>
        {feedback && (
          <div className="marketplace-feedback" style={{ marginBottom: '1rem' }}>{feedback}</div>
        )}

        <div className="hero-search-wrapper" style={{ marginBottom: '1.25rem' }}>
          <div className="hero-search-form">
            <Search className="search-icon" size={20} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search supermarket, groceries, pharmacy, or liquor" />
            <button type="button" className="hero-search-btn" onClick={() => setSearch(search)}>Find Products</button>
          </div>
        </div>
        <div className="categories-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          {Object.entries(categoryMeta).map(([key, value]) => (
            <button key={key} onClick={() => setActiveType(key)} style={{ border: activeType === key ? '1px solid #ff6b00' : '1px solid #e5e7eb', background: activeType === key ? '#fff7ed' : '#fff', borderRadius: '999px', padding: '0.7rem 1rem', fontWeight: '700' }}>
              {value.title}
            </button>
          ))}
        </div>

        <div className="info-box" style={{ marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Package size={18} color="#ff6b00" /> {categoryMeta[activeType]?.title}</h3>
          <p>{categoryMeta[activeType]?.description}</p>
        </div>

        {!loading && featured.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Featured picks</h3>
            <div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              {featured.map((product) => (
                <div key={product._id} className="food-menu-card" style={{ padding: '1rem' }}>
                  <div className="food-image-wrapper" style={{ height: '140px' }}>
                    <img src={product.image || product.images?.[0] || '/delivo.jpg'} alt={product.name} />
                  </div>
                  <div className="food-details">
                    <h3>{product.name}</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{product.brand}</p>
                    <p style={{ fontWeight: '700', color: '#ff6b00' }}>KES {Number(product.finalPrice || product.price).toFixed(2)}</p>
                    <button className="cta-button" disabled={addingId === product._id || product.stock === 0} onClick={() => handleAddToCart(product)}>{addingId === product._id ? 'Adding...' : 'Add to cart'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {products.map((product) => (
            <div key={product._id} className="food-menu-card" style={{ padding: '1rem' }}>
              <div className="food-image-wrapper" style={{ height: '140px' }}>
                <img src={product.image || product.images?.[0] || '/delivo.jpg'} alt={product.name} />
              </div>
              <div className="food-details">
                <h3>{product.name}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{product.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontWeight: '700', color: '#ff6b00' }}>KES {Number(product.finalPrice || product.price).toFixed(2)}</span>
                  <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>{product.stock > 0 ? 'In stock' : 'Out of stock'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
                  {product.prescriptionRequired ? <span style={{ color: '#dc2626', fontSize: '0.8rem' }}><ShieldCheck size={14} /> Prescription needed</span> : <span style={{ color: '#2563eb', fontSize: '0.8rem' }}><BadgeCheck size={14} /> Verified</span>}
                  <button className="cta-button" disabled={addingId === product._id || product.stock === 0} onClick={() => handleAddToCart(product)}>{addingId === product._id ? 'Adding...' : 'Add'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
