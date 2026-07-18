import {useState, useEffect} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllStores, getStoreType } from '../../services/api';
import Loader from '../../components/Loader';
import './StoresByType.css';

const StoresByType = () => {
  const { typeId } = useParams();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [storeType, setStoreType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStoresAndType = async () => {
    try {
      setLoading(true);
      // Fetch store type details
      const typeData = await getStoreType(typeId);
      setStoreType(typeData);

      // Fetch stores of this type
      const storesData = await getAllStores(typeId);
      setStores(storesData);
      setError('');
    } catch (err) {
      setError('Failed to load stores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoresAndType();
  }, [typeId]);

  const handleStoreClick = (storeId) => {
    navigate(`/store/${storeId}`);
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="stores-by-type-container">
      <div className="stores-by-type-header">
        <button className="back-btn" onClick={() => navigate('/stores')}>
          ← Back to Stores
        </button>
        {storeType && (
          <div className="header-info">
            <img src={storeType.icon} alt={storeType.name} className="type-icon" />
            <h1>{storeType.name}</h1>
            <p>{storeType.description || `Explore all ${storeType.name} near you`}</p>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stores-by-type-search">
        <input
          type="text"
          placeholder={`Search ${storeType?.name || 'stores'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredStores.length === 0 ? (
        <div className="no-stores">
          <p>No {storeType?.name?.toLowerCase()} found</p>
        </div>
      ) : (
        <div className="stores-grid">
          {filteredStores.map((store) => (
            <div
              key={store._id}
              className="store-card"
              onClick={() => handleStoreClick(store._id)}
            >
              <div className="store-banner">
                <img src={store.bannerImage} alt={store.name} />
                {!store.isOpen && <div className="closed-badge">Closed</div>}
              </div>
              <div className="store-info">
                <h3>{store.name}</h3>
                <div className="store-details">
                  <span className="rating">⭐ {store.rating}</span>
                  <span className="delivery-time">🚚 {store.deliveryTime}</span>
                </div>
                {store.products && (
                  <p className="product-count">{store.products.length} items</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoresByType;
