import {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStoreTypes } from '../services/api';
import Loader from '../components/Loader';
import MainLayout from '../layouts/MainLayout';
import './Stores.css';

const Stores = () => {
  const navigate = useNavigate();
  const [storeTypes, setStoreTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStoreTypes();
  }, []);

  const fetchStoreTypes = async () => {
    try {
      setLoading(true);
      const data = await getAllStoreTypes();
      setStoreTypes(data);
      setError('');
    } catch (err) {
      setError('Failed to load store types');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreTypeClick = (typeId) => {
    navigate(`/stores/${typeId}`);
  };

  if (loading) return <Loader />;

  return (
    <MainLayout>
      <div className="stores-container">
        <div className="stores-header">
          <h1>Discover Stores</h1>
          <p>Browse all types of stores and find what you need</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {storeTypes.length === 0 ? (
          <div className="no-stores">
            <p>No store types available yet</p>
          </div>
        ) : (
          <div className="stores-grid">
            {storeTypes.map((storeType) => (
              <button
                key={storeType._id}
                className="store-type-card"
                onClick={() => handleStoreTypeClick(storeType._id)}
                style={{
                  borderTop: `4px solid ${storeType.color || '#FF6B35'}`
                }}
              >
                <div className="store-type-icon">
                  <img src={storeType.icon} alt={storeType.name} />
                </div>
                <div className="store-type-info">
                  <h3>{storeType.name}</h3>
                  {storeType.description && (
                    <p>{storeType.description}</p>
                  )}
                </div>
                <div className="store-type-arrow">→</div>
              </button>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="stores-info-section">
          <div className="info-card">
            <span className="info-icon">🚀</span>
            <h4>Fast Delivery</h4>
            <p>Get your orders delivered quickly</p>
          </div>
          <div className="info-card">
            <span className="info-icon">⭐</span>
            <h4>Top Rated</h4>
            <p>Choose from highly rated stores</p>
          </div>
          <div className="info-card">
            <span className="info-icon">💰</span>
            <h4>Great Deals</h4>
            <p>Find amazing offers and discounts</p>
          </div>
          <div className="info-card">
            <span className="info-icon">🛡️</span>
            <h4>Secure</h4>
            <p>Safe and secure shopping experience</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Stores;
