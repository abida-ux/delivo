import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  MapPin,
  Truck,
  ChevronRight,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Store,
  UtensilsCrossed,
  CheckCircle2,
} from 'lucide-react';
import api, { rateFood, getAppSettings } from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import { useCartUI } from '../../context/CartUIContext';
import { AuthContext } from '../../context/AuthContext';
import { AuthModalContext } from '../../context/AuthModalContext';
import FoodCard from '../../components/FoodCard';
import { resolveImageUrl } from '../../utils/placeholderImage';
import './FoodDetailsPage.css';
import SEO from '../../components/SEO';

const FoodDetailsPage = () => {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const { location } = useLocation();
  const { addItem, cartItems, updateQuantity } = useCart();
  const { openCart } = useCartUI();
  const { user } = useContext(AuthContext);
  const { openLoginModal } = useContext(AuthModalContext) || {};


  const [food, setFood] = useState(null);
  const [sellingRestaurants, setSellingRestaurants] = useState([]);
  const [similarFoods, setSimilarFoods] = useState([]);
  const [comboComponents, setComboComponents] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliverySettings, setDeliverySettings] = useState({
    enabled: true,
    amount: 20,
  });

  // 1-Tap Rating State
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingMessage, setRatingMessage] = useState(null);
  const [ratingMessageType, setRatingMessageType] = useState('success');

  useEffect(() => {
    getAppSettings().then(settings => {
      if (settings) {
        setDeliverySettings({
          enabled: settings.deliveryFeeEnabled !== false,
          amount: settings.deliveryFeeAmount != null ? Number(settings.deliveryFeeAmount) : 20,
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchFoodData = async () => {
      try {
        setLoading(true);
        setError(null);

        const lat = location.latitude || '';
        const lng = location.longitude || '';

        const [foodRes, restRes] = await Promise.all([
          api.get(`/foods/${foodId}`),
          api.get(`/foods/${foodId}/restaurants?lat=${lat}&lng=${lng}`),
        ]);

        const currentFood = foodRes.data?.data;
        if (!currentFood) throw new Error('Dish not found');

        if (isMounted) {
          setFood(currentFood);
          if (currentFood.userRating) setUserRating(currentFood.userRating);
          setSellingRestaurants(restRes.data?.data || []);

          let rawPortions = Array.isArray(currentFood.portions) && currentFood.portions.length > 0
            ? currentFood.portions
            : (Array.isArray(currentFood.variations) ? currentFood.variations : []);

          rawPortions = rawPortions.map(p => typeof p === 'string' ? { name: p, price: Number(currentFood.price || 0) } : p);

          let initialPortions = [...rawPortions];

          if (initialPortions.length > 0) {
            setSelectedVariation(initialPortions[0]);
          } else {
            setSelectedVariation(null);
          }

          // Initialize combo components for interactive portion customization
          if (currentFood.isCombination || (currentFood.components && currentFood.components.length > 0)) {
            const initialComponents = (currentFood.components || []).map((comp) => {
              const fId = comp.foodId?._id || comp.foodId;
              const name = comp.foodId?.name || comp.name || 'Component Item';
              const unitPrice = comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || comp.price || 0);
              const defaultQty = comp.defaultQuantity != null ? comp.defaultQuantity : 1;
              const minQty = comp.minimumQuantity != null ? comp.minimumQuantity : 0;
              const maxQty = comp.maximumQuantity != null ? comp.maximumQuantity : 20;

              return {
                foodId: fId,
                name,
                unitPrice,
                quantity: defaultQty,
                minimumQuantity: minQty,
                maximumQuantity: maxQty,
              };
            });
            setComboComponents(initialComponents);
          }
        }


        const categoryName = typeof currentFood.category === 'object'
          ? currentFood.category?.name
          : currentFood.category;

        if (categoryName) {
          const simRes = await api.get(`/foods?category=${encodeURIComponent(categoryName)}&limit=5`);
          if (isMounted && simRes.data?.data) {
            setSimilarFoods(simRes.data.data.filter((item) => item._id !== foodId).slice(0, 4));
          }
        }
      } catch (err) {
        console.error('Error fetching food details:', err);
        if (isMounted) setError(err.response?.data?.message || 'Failed to load meal details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFoodData();
    return () => { isMounted = false; };
  }, [foodId, location.latitude, location.longitude]);

  // Handle combo component quantity increment / decrement
  const updateComponentQty = (idx, change) => {
    setComboComponents((prev) => {
      const updated = [...prev];
      const comp = updated[idx];
      if (!comp) return prev;
      const minQty = comp.minimumQuantity != null ? comp.minimumQuantity : 0;
      const maxQty = comp.maximumQuantity != null ? comp.maximumQuantity : 20;
      const newQty = comp.quantity + change;
      if (newQty >= minQty && newQty <= maxQty) {
        updated[idx] = { ...comp, quantity: newQty };
      }
      return updated;
    });
  };

  // Handle 1-Tap Dish Rating
  const handleRateFood = async (starVal) => {
    if (!user) {
      setRatingMessage('Please sign in to rate this dish!');
      setRatingMessageType('warning');
      if (openLoginModal) openLoginModal();
      return;
    }


    try {
      const res = await rateFood(foodId, starVal);
      if (res?.success) {
        setUserRating(starVal);
        setFood((prev) => ({
          ...prev,
          rating: res.data.rating,
          numReviews: res.data.numReviews,
        }));
        setRatingMessage(`✓ Thank you! You rated this dish ${starVal}★`);
        setRatingMessageType('success');
      }
    } catch (err) {
      console.error('Error rating food:', err);
      setRatingMessage(err.response?.data?.message || 'Failed to submit rating');
      setRatingMessageType('warning');
    }
  };

  const targetPortionName = selectedVariation ? selectedVariation.name : null;
  const existingCartItem = (cartItems || []).find((item) => {
    const itemFoodId = typeof item.foodId === 'object' && item.foodId !== null ? item.foodId._id : item.foodId;
    const targetFoodId = food?._id || foodId;
    if (itemFoodId?.toString() !== targetFoodId?.toString()) return false;
    if (targetPortionName) {
      return (item.portionName || null) === targetPortionName;
    }
    return true;
  });
  const isInCart = Boolean(existingCartItem);

  useEffect(() => {
    if (existingCartItem && existingCartItem.quantity) {
      setQuantity(existingCartItem.quantity);
    }
  }, [existingCartItem?.quantity, selectedVariation?.name]);

  const handleQuantityChange = (newQty) => {
    if (newQty < 1) return;
    setQuantity(newQty);
    if (isInCart && existingCartItem) {
      const targetId = food?._id || foodId;
      updateQuantity(targetId, newQty);
    }
  };

  if (loading) {
    return (
      <div className="food-details-page-wrap">
        <div className="food-details-container">
          <div className="food-skeleton-hero">
            <div className="food-skeleton-img shimmer"></div>
            <div className="food-skeleton-info">
              <div className="food-skeleton-title shimmer"></div>
              <div className="food-skeleton-text shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="food-details-page-wrap">
        <div className="food-details-container" style={{ textAlign: 'center', padding: '80px 24px' }}>
          <UtensilsCrossed size={48} color="#9ca3af" style={{ marginBottom: '16px' }} />
          <h2>Dish Not Found</h2>
          <p>{error || 'The meal you requested is unavailable.'}</p>
          <button className="food-back-menu-btn" onClick={() => navigate('/menu')}>
            <ArrowLeft size={16} /> Return to Menu
          </button>
        </div>
      </div>
    );
  }

  const categoryName = typeof food.category === 'object' ? food.category?.name : (food.category || 'Specialty');
  const isCombinationMeal = Boolean(food.isCombination || (food.components && food.components.length > 0));

  let rawPortions = Array.isArray(food.portions) && food.portions.length > 0
    ? food.portions
    : (Array.isArray(food.variations) ? food.variations : []);

  rawPortions = rawPortions.map(p => typeof p === 'string' ? { name: p, price: Number(food.price || 0) } : p);

  let portionsList = [...rawPortions];

  const fallbackRestId = (typeof food.restaurant === 'object' ? food.restaurant?._id : food.restaurant)
    || (Array.isArray(food.restaurants) && food.restaurants[0] ? (typeof food.restaurants[0] === 'object' ? food.restaurants[0]._id : food.restaurants[0]) : null);

  const fallbackRestName = (typeof food.restaurant === 'object' ? food.restaurant?.name : null)
    || (Array.isArray(food.restaurants) && food.restaurants[0] && typeof food.restaurants[0] === 'object' ? food.restaurants[0].name : null)
    || food.restaurantName
    || 'Delivo Kitchen';

  const primaryVendor = sellingRestaurants[0] || {
    restaurantId: fallbackRestId,
    name: fallbackRestName,
    rating: food.rating || 4.5,
    deliveryFee: deliverySettings.amount,
    deliveryTime: '20-30',
  };

  // Real-time unit price: combo portions > selected portion > base price
  const customizedComboPrice = isCombinationMeal && comboComponents.length > 0
    ? comboComponents.reduce((sum, c) => sum + (c.unitPrice * c.quantity), 0)
    : (food.price != null && food.price > 0 ? food.price : (primaryVendor.price || 0));

  const unitPrice = isCombinationMeal
    ? customizedComboPrice
    : (selectedVariation ? selectedVariation.price : customizedComboPrice);

  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    if (isCombinationMeal) {
      const customizedItem = {
        _id: food._id,
        name: food.name,
        image: food.image,
        price: unitPrice,
        isCombination: true,
        combinationId: food._id,
        components: comboComponents.map(c => ({
          foodId: c.foodId,
          name: c.name,
          quantity: c.quantity,
          price: c.unitPrice,
        })),
        restaurantId: primaryVendor?.restaurantId,
        restaurantName: primaryVendor?.name,
      };

      addItem(customizedItem, quantity, {
        restaurantId: primaryVendor?.restaurantId,
        name: primaryVendor?.name,
        price: unitPrice,
      });
    } else {
      const portionName = selectedVariation ? selectedVariation.name : null;
      addItem({
        ...food,
        name: food.name,
        portionName: portionName,
        price: unitPrice,
        restaurantId: primaryVendor?.restaurantId,
        restaurantName: primaryVendor?.name,
      }, quantity, {
        restaurantId: primaryVendor?.restaurantId,
        name: primaryVendor?.name,
        price: unitPrice,
      });
    }
    openCart();
  };

  const productSchema = food ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": food.name,
    "image": food.image || "https://delivo.co.ke/delivo.jpg",
    "description": food.description || `Order delicious ${food.name} online on Delivo.`,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "KES",
      "price": unitPrice,
      "availability": food.defaultAvailability !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": primaryVendor.name || "Delivo Vendor"
      }
    }
  } : null;

  return (
    <div className="food-details-page-wrap">
      <SEO
        title={food.name}
        description={food.description ? (food.description.length > 150 ? food.description.substring(0, 150) + '...' : food.description) : `Order delicious ${food.name} online on Delivo. Lightning-fast on-demand delivery to your door.`}
        image={food.image}
        schema={productSchema}
      />
      <div className="food-details-container">
        {/* Breadcrumb */}
        <nav className="food-breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/menu')}>Menu</button>
          <ChevronRight size={14} />
          {categoryName && <span>{categoryName}</span>}
          <ChevronRight size={14} />
          <strong className="active">{food.name}</strong>
        </nav>

        {/* Core Hero Layout */}
        <div className="food-hero-card">
          <div className="food-image-frame">
            <img src={resolveImageUrl(food.image)} alt={food.name} />
          </div>

          <div className="food-info-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="category-chip">{categoryName}</span>
              {isCombinationMeal && (
                <span className="combo-hero-pill">Combo Bundle</span>
              )}
            </div>
            <h1 className="dish-name">{food.name}</h1>
            <p className="dish-description">{food.description || 'Prepared fresh with high quality ingredients.'}</p>

            <div className="price-display">
              <span className="price-tag">KES {unitPrice.toLocaleString('en-KE')}</span>
              {isCombinationMeal && (
                <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px', fontWeight: 600 }}>
                  (Adjusted by portions below)
                </span>
              )}
            </div>

            {/* PORTION / SIZE SELECTOR */}
            {!isCombinationMeal && portionsList.length > 0 && (
              <div style={{ background: '#ffffff', border: '1.5px solid #FF6B4A', padding: '14px 16px', borderRadius: '12px', marginTop: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0' }}>Choose your portion</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {portionsList.map((p, idx) => {
                    const isSelected = selectedVariation?.name === p.name && selectedVariation?.price === p.price;
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedVariation(p)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          border: isSelected ? '2px solid #FF6B4A' : '1.5px solid #e2e8f0',
                          background: isSelected ? '#fff5f2' : '#ffffff',
                          color: isSelected ? '#FF6B4A' : '#334155',
                          transition: 'all 0.15s ease',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: '16px', color: isSelected ? '#FF6B4A' : '#94a3b8' }}>
                          {isSelected ? '◉' : '○'}
                        </span>
                        <span style={{ flex: 1 }}>{p.name}</span>
                        <span style={{ fontWeight: '800' }}>KES {Number(p.price || 0).toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COMBO PORTION CUSTOMIZER WIDGET */}
            {isCombinationMeal && comboComponents.length > 0 && (
              <div className="combo-customizer-box">
                <div className="combo-customizer-top">
                  <span className="combo-customizer-title">Customize Components & Portions</span>
                  <span className="combo-customizer-hint">Need extra chapatis or sides? Adjust quantities below</span>
                </div>

                <div className="combo-comp-list">
                  {comboComponents.map((comp, idx) => {
                    const minQty = comp.minimumQuantity != null ? comp.minimumQuantity : 0;
                    const maxQty = comp.maximumQuantity != null ? comp.maximumQuantity : 20;

                    return (
                      <div key={comp.foodId || idx} className="combo-comp-row">
                        <div className="comp-meta">
                          <strong className="comp-name">{comp.name}</strong>
                          <span className="comp-rate">KES {comp.unitPrice} each</span>
                        </div>

                        <div className="comp-stepper-wrap">
                          <button
                            type="button"
                            className="comp-btn minus"
                            onClick={() => updateComponentQty(idx, -1)}
                            disabled={comp.quantity <= minQty}
                            title={comp.quantity <= minQty ? 'Minimum portion reached' : 'Reduce portion'}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="comp-qty-num">{comp.quantity}</span>
                          <button
                            type="button"
                            className="comp-btn plus"
                            onClick={() => updateComponentQty(idx, 1)}
                            disabled={comp.quantity >= maxQty}
                            title={comp.quantity >= maxQty ? 'Maximum portion reached' : 'Add extra portion'}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* REAL RATING SCORE & 1-TAP STAR RATING WIDGET */}
            <div className="dish-rating-widget-box">
              <div className="rating-score-display">
                <div className="rating-stars-badge">
                  <Star size={16} fill={food.rating > 0 ? '#f5b301' : 'none'} color={food.rating > 0 ? '#f5b301' : '#9ca3af'} />
                  <strong>{food.rating > 0 ? food.rating : 'New'}</strong>
                </div>
                <span className="reviews-count-text">
                  {food.numReviews > 0 ? `(${food.numReviews} ${food.numReviews === 1 ? 'rating' : 'ratings'})` : 'No ratings yet'}
                </span>
              </div>

              <div className="one-tap-rating-picker">
                <span className="rate-prompt-text">Tap to rate:</span>
                <div className="stars-picker-group">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      className="star-rate-btn"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRateFood(starVal)}
                      title={`Rate ${starVal} ${starVal === 1 ? 'star' : 'stars'}`}
                    >
                      <Star
                        size={18}
                        fill={(hoverRating || userRating || 0) >= starVal ? '#f5b301' : 'none'}
                        color={(hoverRating || userRating || 0) >= starVal ? '#f5b301' : '#d1d5db'}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {ratingMessage && (
              <div className={`rating-status-message ${ratingMessageType}`}>
                {ratingMessage}
              </div>
            )}

            {/* Vendor Stats */}
            <div className="vendor-meta-box">
              <div className="meta-item">
                <Store size={14} color="#FF6B4A" />
                <span>{primaryVendor.name}</span>
              </div>
              <div className="meta-item">
                <Clock size={14} color="#FF6B4A" />
                <span>{primaryVendor.deliveryTime || '20-30'} mins</span>
              </div>
              <div className="meta-item">
                <Truck size={14} color="#FF6B4A" />
                <span>{deliverySettings.enabled ? `KES ${deliverySettings.amount} delivery` : 'FREE delivery'}</span>
              </div>
            </div>

            {/* Quantity Stepper & Add to Cart */}
            <div className="order-stepper-row">
              <div className="stepper-controls">
                <button disabled={quantity <= 1} onClick={() => handleQuantityChange(quantity - 1)}>
                  <Minus size={14} />
                </button>
                <span>{quantity}</span>
                <button onClick={() => handleQuantityChange(quantity + 1)}>
                  <Plus size={14} />
                </button>
              </div>

              {isInCart ? (
                <button
                  className="add-to-cart-btn in-cart-mode"
                  onClick={openCart}
                  style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#ffffff' }}
                >
                  <ShoppingBag size={18} /> View Cart ({existingCartItem.quantity} in Cart)
                </button>
              ) : (
                <button className="add-to-cart-btn" onClick={handleAddToCart}>
                  <ShoppingBag size={18} /> Add {quantity > 1 ? `${quantity} Combos` : 'to Cart'} • KES {totalPrice.toLocaleString()}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Frequently Ordered Together */}
        {similarFoods.length > 0 && (
          <section style={{ marginTop: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
              Frequently ordered together
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
              {similarFoods.slice(0, 3).map((freqItem) => (
                <div
                  key={`freq-${freqItem._id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    background: '#ffffff',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    gap: '12px',
                  }}
                >
                  <img
                    src={resolveImageUrl(freqItem.image)}
                    alt={freqItem.name}
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {freqItem.name}
                    </h4>
                    <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#16a34a' }}>
                      KES {Number(freqItem.price || 0).toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/food/${freqItem._id}`)}
                    style={{
                      background: '#fff5f2',
                      color: '#FF6B4A',
                      border: '1px solid #ffcfc5',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* You May Also Like */}
        {similarFoods.length > 0 && (
          <section className="similar-foods-section" style={{ marginTop: '28px' }}>
            <h3>You May Also Like</h3>
            <div className="similar-cards-grid">
              {similarFoods.map((item) => (
                <FoodCard key={item._id} food={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default FoodDetailsPage;
