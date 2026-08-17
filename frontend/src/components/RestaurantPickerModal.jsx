import { useState, useEffect } from 'react';
import { Store, Star, Clock, AlertTriangle, Check, X, ChevronRight } from 'lucide-react';
import api from '../services/api';
import './RestaurantPickerModal.css';

const RestaurantPickerModal = ({ isOpen, item, onClose, onSelectRestaurant }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getNormalizedFoodId = (cartItem) => {
    if (!cartItem) return null;
    if (cartItem.productType === 'marketplace') {
      return cartItem.marketplaceProductId || cartItem.foodId || cartItem._id;
    }
    return typeof cartItem.foodId === 'object' && cartItem.foodId !== null
      ? cartItem.foodId._id
      : cartItem.foodId;
  };

  const getNormalizedRestaurantId = (cartItem) => {
    if (!cartItem || !cartItem.restaurantId) return null;
    return typeof cartItem.restaurantId === 'object'
      ? cartItem.restaurantId._id
      : cartItem.restaurantId;
  };

  const foodId = getNormalizedFoodId(item);
  const currentRestId = getNormalizedRestaurantId(item);

  useEffect(() => {
    if (!isOpen || !foodId) return;

    let isMounted = true;
    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);
      setOptions([]);

      try {
        const res = await api.get(`/foods/${foodId}/restaurants`);
        const data = res.data?.data || [];
        if (isMounted) {
          setOptions(data);
        }
      } catch (err) {
        console.error('Error fetching restaurants for dish:', err);
        if (isMounted) {
          setError('Unable to load restaurants offering this dish.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRestaurants();

    return () => {
      isMounted = false;
    };
  }, [isOpen, foodId]);

  if (!isOpen || !item) return null;

  return (
    <div className="rest-picker-overlay" onClick={onClose}>
      <div className="rest-picker-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Modal / Bottom Sheet Header */}
        <div className="rest-picker-header">
          <div className="rest-picker-title-col">
            <span className="rest-picker-eyebrow">CHOOSE RESTAURANT</span>
            <h3 className="rest-picker-dish-name">{item.name}</h3>
          </div>
          <button className="rest-picker-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <p className="rest-picker-instruction">
          Select which kitchen should prepare your <strong>{item.name}</strong>:
        </p>

        {/* Options List */}
        <div className="rest-picker-options">
          {loading ? (
            <div className="rest-picker-loading">
              <div className="rest-picker-spinner"></div>
              <p>Finding kitchens offering {item.name}...</p>
            </div>
          ) : error ? (
            <div className="rest-picker-error">
              <AlertTriangle size={24} />
              <p>{error}</p>
            </div>
          ) : options.length === 0 ? (
            <div className="rest-picker-empty">
              <Store size={36} />
              <h4>No Kitchens Available</h4>
              <p>No verified restaurants are currently offering this dish.</p>
            </div>
          ) : (
            options.map((opt) => {
              const optRestId = opt.restaurantId || opt._id || opt.id;
              const isSelected = currentRestId && currentRestId.toString() === optRestId?.toString();
              const price = Number(opt.price || 0);

              return (
                <div
                  key={optRestId}
                  className={`rest-option-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => onSelectRestaurant(opt)}
                >
                  <div className="rest-option-main">
                    <div className="rest-option-name-row">
                      <h4 className="rest-option-kitchen">{opt.name}</h4>
                      {isSelected && (
                        <span className="rest-selected-badge">
                          <Check size={12} /> Selected
                        </span>
                      )}
                    </div>

                    <div className="rest-option-dish-price">
                      {item.name} — <strong>KES {price.toLocaleString()}</strong>
                    </div>

                    <div className="rest-option-tags">
                      {opt.rating && (
                        <span className="rest-tag rating">
                          <Star size={11} fill="#f59e0b" color="#f59e0b" />
                          {opt.rating}
                        </span>
                      )}
                      {opt.prepTime && (
                        <span className="rest-tag">
                          <Clock size={11} />
                          {opt.prepTime} mins
                        </span>
                      )}
                      {opt.distance && (
                        <span className="rest-tag">
                          {opt.distance} km
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`rest-select-action-btn ${isSelected ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRestaurant(opt);
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantPickerModal;
