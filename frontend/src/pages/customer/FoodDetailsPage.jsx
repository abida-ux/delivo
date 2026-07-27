import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, Truck, ChevronRight, Plus, Minus, Layers, ShoppingBag } from 'lucide-react';
import api from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import { useCartUI } from '../../context/CartUIContext';
import FoodCard from '../../components/FoodCard';
import { resolveImageUrl } from '../../utils/placeholderImage';
import './FoodDetailsPage.css';

const FoodDetailsPage = () => {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const { location } = useLocation();
  const { addItem } = useCart();
  const { openCart } = useCartUI();

  const [food, setFood] = useState(null);
  const [sellingRestaurants, setSellingRestaurants] = useState([]);
  const [similarFoods, setSimilarFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Combo component quantity editors
  const [componentQtys, setComponentQtys] = useState({});

  useEffect(() => {
    const fetchFoodDetailsAndVendors = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch main catalog food info
        const foodRes = await api.get(`/foods/${foodId}`);
        const currentFood = foodRes.data.data;
        setFood(currentFood);

        // Initialize component quantities for combo items
        if (currentFood?.components?.length > 0) {
          const initQtys = {};
          currentFood.components.forEach(comp => {
            const id = comp.foodId?._id || comp.foodId;
            if (id) initQtys[id] = comp.defaultQuantity || 1;
          });
          setComponentQtys(initQtys);
        }

        // 2. Fetch list of restaurants selling this food
        const lat = location.latitude || '';
        const lng = location.longitude || '';
        const restRes = await api.get(`/foods/${foodId}/restaurants?lat=${lat}&lng=${lng}`);
        setSellingRestaurants(restRes.data.data || []);

        // 3. Fetch similar items from the same category
        if (currentFood && currentFood.category) {
          const { getAllFoods } = await import('../../services/api');
          const allFoods = await getAllFoods();
          const filtered = allFoods.filter(item =>
            item.category === currentFood.category &&
            item._id !== foodId
          );
          setSimilarFoods(filtered.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load food details page details:', err);
        setError('Failed to load food details page items');
      } finally {
        setLoading(false);
      }
    };

    fetchFoodDetailsAndVendors();
  }, [foodId, location.latitude, location.longitude]);

  const handleComponentQtyChange = (compId, delta, comp) => {
    setComponentQtys(prev => {
      const current = prev[compId] ?? (comp.defaultQuantity || 1);
      const min = comp.minimumQuantity ?? 0;
      const max = comp.maximumQuantity ?? 10;
      const next = Math.min(max, Math.max(min, current + delta));
      return { ...prev, [compId]: next };
    });
  };

  // Calculate total price from current component quantities
  const calcComboTotal = (food) => {
    if (!food?.components?.length) return food?.price || 0;
    return food.components.reduce((sum, comp) => {
      const id = comp.foodId?._id || comp.foodId;
      const qty = componentQtys[id] ?? comp.defaultQuantity ?? 1;
      const unitPrice = comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || 0);
      return sum + unitPrice * qty;
    }, 0);
  };

  const handleOrderComboFromRestaurant = (rest) => {
    const comboComponents = food.components.map(comp => {
      const id = comp.foodId?._id || comp.foodId;
      return {
        foodId: id,
        name: comp.foodId?.name || 'Item',
        quantity: componentQtys[id] ?? comp.defaultQuantity ?? 1,
        price: comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || 0),
      };
    });

    const totalPrice = calcComboTotal(food);

    const comboCartItem = {
      ...food,
      price: totalPrice,
      restaurantId: rest.restaurantId,
      isCombination: true,
      components: comboComponents,
    };

    addItem(comboCartItem, 1);
    openCart();
  };

  const handleOrderFromRestaurant = (rest) => {
    const foodWithSelectedPrice = {
      ...food,
      price: rest.price,
      restaurantId: rest.restaurantId,
    };
    addItem(foodWithSelectedPrice, 1);
    openCart();
  };

  if (loading) {
    return (
      <div className="food-details-container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <p style={{ fontSize: '18px', color: '#6b7280', fontWeight: '500' }}>Loading details...</p>
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="food-details-container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <p style={{ fontSize: '18px', color: '#ef4444', fontWeight: '600' }}>{error || 'Food item not found'}</p>
      </div>
    );
  }

  const isCombo = food.isCombination || (food.components && food.components.length > 0);
  const comboTotal = isCombo ? calcComboTotal(food) : null;

  return (
    <div className="food-details-container">

      {/* breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/menu')}>Menu</span>
        <ChevronRight size={14} />
        <span style={{ color: '#111827' }}>{food.name}</span>
      </div>

      {/* HERO SECTION */}
      <div className="food-details-hero">
        <div className="food-details-img-wrapper">
          <img
            src={resolveImageUrl(food.image)}
            alt={food.name}
            className="food-details-img"
          />
          {isCombo && (
            <div style={{
              position: 'absolute', top: '12px', left: '12px',
              background: '#f97316', color: 'white', padding: '5px 12px',
              borderRadius: '999px', fontSize: '12px', fontWeight: '700',
              display: 'flex', alignItems: 'center', gap: '5px',
              boxShadow: '0 2px 10px rgba(249,115,22,0.4)'
            }}>
              <Layers size={13} /> Combo Meal
            </div>
          )}
        </div>
        <div className="food-details-info">
          <h1 className="food-details-name">{food.name}</h1>
          <p className="food-details-desc">{food.description}</p>

          <div className="food-details-meta">
            <span className="meta-pill">Category: {food.category || (isCombo ? 'Combo Meal' : 'Standard')}</span>
            {food.prepTime && <span className="meta-pill">Prep Time: {food.prepTime} mins</span>}
          </div>

          {/* ── COMBO COMPONENT QUANTITY EDITOR ── */}
          {isCombo && food.components?.length > 0 && (
            <div className="combo-component-editor">
              <h3 className="combo-editor-title">
                <ShoppingBag size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Customise Your Combo
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', marginTop: '4px' }}>
                Adjust individual item quantities below
              </p>
              <div className="combo-editor-list">
                {food.components.map((comp, idx) => {
                  const id = comp.foodId?._id || comp.foodId;
                  const qty = componentQtys[id] ?? comp.defaultQuantity ?? 1;
                  const min = comp.minimumQuantity ?? 0;
                  const max = comp.maximumQuantity ?? 10;
                  const unitPrice = comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || 0);
                  const name = comp.foodId?.name || `Item ${idx + 1}`;
                  return (
                    <div key={id || idx} className="combo-editor-row">
                      <div className="combo-editor-food-info">
                        <span className="combo-editor-food-name">{name}</span>
                        <span className="combo-editor-food-price">KES {unitPrice} each</span>
                        {comp.isOptional && <span className="combo-optional-tag">Optional</span>}
                      </div>
                      <div className="combo-editor-qty-ctrl">
                        <button
                          className="combo-qty-btn"
                          onClick={() => handleComponentQtyChange(id, -1, comp)}
                          disabled={qty <= min}
                          type="button"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="combo-qty-value">{qty}</span>
                        <button
                          className="combo-qty-btn"
                          onClick={() => handleComponentQtyChange(id, 1, comp)}
                          disabled={qty >= max}
                          type="button"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="combo-editor-line-total">
                        KES {(unitPrice * qty).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="combo-editor-total-row">
                <span>Combo Total</span>
                <strong>KES {comboTotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SELLING RESTAURANTS SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 className="restaurants-section-title">Available from {sellingRestaurants.length} Restaurants</h2>

        {sellingRestaurants.length === 0 ? (
          <div style={{ padding: '40px', background: '#f9fafb', borderRadius: '16px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontWeight: '500', margin: 0 }}>
              No restaurants are currently selling this food item near you.
            </p>
          </div>
        ) : (
          <div className="restaurants-grid">
            {sellingRestaurants.map((rest) => (
              <div key={rest.restaurantId} className="restaurant-selling-card">

                <div className="rest-card-header">
                  <div>
                    <h3 className="rest-card-name">{rest.name}</h3>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: rest.isOpen ? '#10b981' : '#ef4444',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {rest.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                  <span className="rest-card-rating">
                    <Star size={12} fill="#d97706" />
                    {rest.rating}
                  </span>
                </div>

                <div className="rest-card-details">
                  <div className="detail-item-col">
                    <span className="detail-item-label"><MapPin size={11} style={{ display: 'inline', marginRight: '4px' }} /> Distance</span>
                    <span className="detail-item-val">{rest.distance} km</span>
                  </div>
                  <div className="detail-item-col">
                    <span className="detail-item-label"><Truck size={11} style={{ display: 'inline', marginRight: '4px' }} /> Delivery Fee</span>
                    <span className="detail-item-val">KES {rest.deliveryFee}</span>
                  </div>
                  <div className="detail-item-col">
                    <span className="detail-item-label"><Clock size={11} style={{ display: 'inline', marginRight: '4px' }} /> Delivery Time</span>
                    <span className="detail-item-val">{rest.deliveryTime} mins</span>
                  </div>
                </div>

                <div className="rest-card-action-row">
                  <div className="rest-card-price">
                    {isCombo
                      ? `KES ${comboTotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
                      : `KES ${rest.price}`}
                  </div>
                  <button
                    className="order-now-cta-btn"
                    onClick={() => isCombo ? handleOrderComboFromRestaurant(rest) : handleOrderFromRestaurant(rest)}
                    disabled={!rest.isOpen}
                  >
                    {isCombo ? 'Add Combo to Cart' : 'Add to Cart'}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* SIMILAR FOODS SECTION ("YOU MAY ALSO LIKE") */}
      {similarFoods.length > 0 && (
        <div style={{ marginTop: '60px', borderTop: '1px solid #e5e7eb', paddingTop: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginBottom: '24px' }}>
            You May Also Like
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {similarFoods.map((item) => (
              <FoodCard key={item._id} food={item} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default FoodDetailsPage;
