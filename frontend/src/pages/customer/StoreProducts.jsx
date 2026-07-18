import {useState, useEffect} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStoreById } from '../../services/api';
import { useCart } from '../../context/CartContext';
import FoodCard from '../../components/FoodCard';
import Loader from '../../components/Loader';
import './StoreProducts.css';

const StoreProducts = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchStore = async () => {
    try {
      setLoading(true);
      const storeData = await getStoreById(storeId);
      setStore(storeData);
      setProducts(storeData.products || []);
      setError('');
    } catch (err) {
      setError('Failed to load store');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, [storeId]);

  const categories = [
    'all',
    ...new Set(products.map(p => p.category))
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <Loader />;

  return (
    <div className="store-products-container">
      {store && (
        <>
          <div className="store-products-header">
            <button className="back-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <div className="store-banner-section">
              <img src={store.bannerImage} alt={store.name} className="store-banner" />
              <div className="store-overlay">
                <h1>{store.name}</h1>
                <div className="store-stats">
                  <span>⭐ {store.rating}</span>
                  <span>🚚 {store.deliveryTime}</span>
                  <span>{products.length} Items</span>
                </div>
              </div>
            </div>
          </div>

          <div className="store-products-controls">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <div className="category-filter">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-btn ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {filteredProducts.length === 0 ? (
            <div className="no-products">
              <p>No products found</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <FoodCard
                  key={product._id}
                  food={product}
                  onAddToCart={(food) => addItem(food, 1)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StoreProducts;
