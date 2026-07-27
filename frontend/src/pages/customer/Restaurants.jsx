import {useState, useEffect} from 'react';
import { Star, Clock, ShoppingBag, Plus, Minus, Heart, Share2, ShieldCheck, X, Loader } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurantById, getFoodsByRestaurant, createOrder } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { resolveImageUrl, handleImageError } from '../../utils/placeholderImage';
import './Restaurants.css';

const Restaurants = () => {
  const { id: restaurantId } = useParams();
  const navigate = useNavigate();
  const { addItem, cart, removeItem, updateQuantity, getCartTotal, clearCart } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [customizingCombo, setCustomizingCombo] = useState(null);
  const [comboComponents, setComboComponents] = useState([]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      setError(null);

      const restaurantData = await getRestaurantById(restaurantId);
      setRestaurant(restaurantData);

      const foodsData = await getFoodsByRestaurant(restaurantId);
      
      let combosData = [];
      try {
        const combosRes = await api.get(`/combinations?restaurantId=${restaurantId}`);
        combosData = combosRes.data.data || [];
      } catch (err) {
        console.error('Failed to load combos for restaurant:', err);
      }

      const mergedMenu = [...foodsData, ...combosData];
      setFoods(mergedMenu);

      const uniqueCategories = [...new Set(mergedMenu.map(item => {
        if (item.category) return item.category;
        if (item.categories && item.categories.length > 0) {
          return typeof item.categories[0] === 'object' ? item.categories[0].name : item.categories[0];
        }
        return 'Other';
      }))];
      setCategories(uniqueCategories.filter(Boolean));
      if (uniqueCategories.length > 0) {
        setActiveCategory(uniqueCategories[0]);
      }
    } catch (err) {
      setError('Failed to load restaurant data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!restaurantId) {
      setError('No restaurant selected');
      return;
    }

    fetchRestaurantData();
  }, [restaurantId]);

  const isRestaurantOpen = restaurant?.isOpen !== false;

  const handleAddToCart = (food) => {
    if (!isRestaurantOpen) {
      alert('This restaurant is currently closed and cannot receive orders right now.');
      return;
    }

    if (food.isCombination) {
      const mapped = food.components.map(comp => {
        const matchingFood = foods.find(f => f._id === (comp.foodId?._id || comp.foodId));
        const resolvedPrice = comp.customPrice !== undefined && comp.customPrice !== null && comp.customPrice !== ''
          ? comp.customPrice
          : (matchingFood ? matchingFood.price : 0);
        return {
          foodId: comp.foodId?._id || comp.foodId,
          name: comp.foodId?.name || matchingFood?.name || 'Component Item',
          quantity: comp.defaultQuantity,
          minimumQuantity: comp.minimumQuantity,
          maximumQuantity: comp.maximumQuantity,
          price: resolvedPrice,
        };
      });
      setComboComponents(mapped);
      setCustomizingCombo(food);
    } else {
      addItem(food, 1);
    }
  };

  const getCustomizedComboTotal = () => {
    return comboComponents.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  };

  const updateComponentQty = (idx, change) => {
    const updated = [...comboComponents];
    const comp = updated[idx];
    const newQty = comp.quantity + change;
    if (newQty >= comp.minimumQuantity && newQty <= comp.maximumQuantity) {
      comp.quantity = newQty;
      setComboComponents(updated);
    }
  };

  const handleAddCustomizedCombo = () => {
    const comboPrice = getCustomizedComboTotal();
    const customizedItem = {
      _id: customizingCombo._id,
      name: customizingCombo.name,
      image: customizingCombo.image,
      price: comboPrice,
      isCombination: true,
      combinationId: customizingCombo._id,
      components: comboComponents.map(c => ({
        foodId: c.foodId,
        name: c.name,
        quantity: c.quantity,
        price: c.price,
      })),
    };

    addItem(customizedItem, 1);
    setCustomizingCombo(null);
  };

  const handleRemoveFromCart = (foodId) => {
    removeItem(foodId);
  };

  const handleUpdateQuantity = (foodId, newQuantity) => {
    if (!isRestaurantOpen) {
      alert('This restaurant is currently closed and cannot receive orders right now.');
      return;
    }
    if (newQuantity <= 0) {
      handleRemoveFromCart(foodId);
    } else {
      updateQuantity(foodId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (Object.keys(cart).length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      setCheckoutLoading(true);
      setCheckoutError(null);

      // Prepare order data
      const items = Object.values(cart).map(item => ({
        foodId: item._id,
        quantity: item.quantity,
      }));

      const orderData = {
        userId: 'temp-user-id-123', // TODO: Replace with actual user ID from auth
        items,
        totalPrice: getCartTotal(),
        deliveryAddress: 'Sample Address', // TODO: Get from user
        paymentMethod: 'mpesa', // TODO: Let user select
        specialInstructions: '',
      };

      const response = await createOrder(orderData);
      setCheckoutSuccess(true);
      clearCart();

      // Show success message
      setTimeout(() => {
        alert(`Order created successfully! Order ID: ${response._id}`);
        setShowCheckout(false);
        setCheckoutSuccess(false);
        navigate('/');
      }, 1500);
    } catch (err) {
      setCheckoutError(err.response?.data?.message || 'Failed to create order');
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getFoodsByCategory = (category) => {
    return foods.filter(item => {
      if (item.category === category) return true;
      if (item.categories && Array.isArray(item.categories)) {
        return item.categories.some(cat => 
          (typeof cat === 'object' ? cat.name : cat) === category
        );
      }
      return false;
    });
  };

  const scrollToCategory = (category) => {
    setActiveCategory(category);
    const el = document.getElementById(`sec-${category.replace(/\s+/g, '-')}`);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 160,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="res-page-shell">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Loader className="spin" size={40} />
          <p>Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="res-page-shell">
        <div style={{ padding: '40px', textAlign: 'center', color: '#ff6b6b' }}>
          <p>❌ {error || 'Restaurant not found'}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#D4AF37',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="res-page-shell">
      {/* HEADER */}
      <div
        className="res-hero-wrapper"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.75)), url(${resolveImageUrl(restaurant.bannerImage)})`
        }}
      >
        <div className="res-hero-top-actions">
          <button className="res-action-circle" onClick={() => setIsLiked(!isLiked)}>
            <Heart size={18} fill={isLiked ? "#ff4d4f" : "none"} />
          </button>
          <button className="res-action-circle">
            <Share2 size={18} />
          </button>
        </div>

        <div className="res-hero-caption">
          <div className="res-status-row">
            <span className={`res-status-tag ${isRestaurantOpen ? 'open' : 'closed'}`}>
              {isRestaurantOpen ? 'Open Now' : 'Closed'}
            </span>
            <span className="res-delivery-badge">
              <ShieldCheck size={14} /> Delivo Verified
            </span>
          </div>

          <h1 className="res-brand-title">{restaurant.name}</h1>
          <p className="res-cuisine-subtext">{restaurant.cuisine?.join(' • ') || 'Restaurant'}</p>
        </div>
      </div>

      {!isRestaurantOpen && (
        <div className="res-closed-banner">
          <strong>This restaurant is currently closed.</strong> You can still browse the menu, but orders cannot be placed right now.
        </div>
      )}

      <div className="res-details-card">
        <div className="res-details-grid">
          <div className="res-detail-item">
            <span className="res-detail-label">Location</span>
            <span className="res-detail-value">{restaurant.location || 'Location not provided yet'}</span>
          </div>
          <div className="res-detail-item">
            <span className="res-detail-label">Phone</span>
            <span className="res-detail-value">{restaurant.phone || 'Not provided'}</span>
          </div>
          <div className="res-detail-item">
            <span className="res-detail-label">Email</span>
            <span className="res-detail-value">{restaurant.email || 'Not provided'}</span>
          </div>
          <div className="res-detail-item">
            <span className="res-detail-label">Hours</span>
            <span className="res-detail-value">{restaurant.openingHours && restaurant.closingHours ? `${restaurant.openingHours} - ${restaurant.closingHours}` : 'Hours not provided'}</span>
          </div>
          <div className="res-detail-item">
            <span className="res-detail-label">Delivery Radius</span>
            <span className="res-detail-value">{restaurant.deliveryRadius ? `${restaurant.deliveryRadius} km` : 'Not provided'}</span>
          </div>
          <div className="res-detail-item">
            <span className="res-detail-label">About</span>
            <span className="res-detail-value">{restaurant.description || 'More details coming soon.'}</span>
          </div>
        </div>
      </div>

      {/* STICKY BAR */}
      {categories.length > 0 && (
        <div className="res-sticky-navigation-hub">
          <div className="res-category-navbar">
            <div className="res-category-scroll-rail">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`res-category-pill-trigger ${activeCategory === cat ? 'is-active' : ''}`}
                  onClick={() => scrollToCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MENU */}
      <div className="res-menu-feed-container">
        {categories.map((category) => {
          const categoryFoods = getFoodsByCategory(category);
          return (
            <div key={category} id={`sec-${category.replace(/\s+/g, '-')}`}>
              <h2>{category}</h2>

              {categoryFoods.length === 0 ? (
                <p style={{ color: '#999', fontStyle: 'italic' }}>No items available</p>
              ) : (
                <div className="res-food-grid">
                  {categoryFoods.map((item) => (
                    <div key={item._id} className="res-food-card">
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.description || 'No description'}</p>
                        <span>KES {item.price}</span>
                      </div>

                      <div>
                        <img src={resolveImageUrl(item.image)} alt={item.name} onError={handleImageError} />

                        {cart[item._id] ? (
                          <div className="cart-controls">
                            <button
                              className="cart-btn"
                              onClick={() => handleUpdateQuantity(item._id, cart[item._id].quantity - 1)}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="cart-qty">{cart[item._id].quantity}</span>
                            <button
                              className="cart-btn"
                              onClick={() => handleUpdateQuantity(item._id, cart[item._id].quantity + 1)}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="add-to-cart-btn"
                            onClick={() => handleAddToCart(item)}
                          >
                            <Plus size={16} /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CART FLOAT */}
      {Object.keys(cart).length > 0 && (
        <button
          className="res-basket-float-sheet"
          onClick={() => isRestaurantOpen && setShowCheckout(true)}
          disabled={!isRestaurantOpen}
        >
          <ShoppingBag />
          <span>{Object.keys(cart).length} items • KES {getCartTotal()}</span>
        </button>
      )}

      {/* CART MODAL */}
      {showCheckout && (
        <div className="cart-modal-overlay">
          <div className="cart-modal">
            <div className="cart-modal-header">
              <h2>Your Cart</h2>
              <button
                className="close-btn"
                onClick={() => setShowCheckout(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="cart-modal-items">
              {Object.values(cart).map((item) => (
                <div key={item._id} className="cart-modal-item">
                  <div>
                    <h4>{item.name}</h4>
                    <p>KES {item.price} x {item.quantity}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFromCart(item._id)}
                    className="remove-btn"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-modal-total">
              <strong>Total: KES {getCartTotal()}</strong>
            </div>

            {checkoutError && (
              <div style={{ color: '#ff6b6b', marginBottom: '10px' }}>
                {checkoutError}
              </div>
            )}

            {checkoutSuccess && (
              <div style={{ color: '#51cf66', marginBottom: '10px' }}>
                ✅ Order created successfully!
              </div>
            )}

            <button
              className="cart-modal-btn"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <>
                  <Loader size={18} className="spin" /> Processing...
                </>
              ) : (
                'Checkout'
              )}
            </button>
          </div>
        </div>
      )}
      {/* COMBINATION CUSTOMIZER MODAL */}
      {customizingCombo && (
        <div className="cart-modal-overlay" style={{ zIndex: 3000 }}>
          <div className="cart-modal" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="cart-modal-header" style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Customise {customizingCombo.name}</h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '2px' }}>Adjust components to your liking</p>
              </div>
              <button className="close-btn" onClick={() => setCustomizingCombo(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="cart-modal-items" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 0' }}>
              {comboComponents.map((comp, idx) => (
                <div key={comp.foodId} className="combo-customiser-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>{comp.name}</h4>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>KES {comp.price} each</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => updateComponentQty(idx, -1)}
                      disabled={comp.quantity <= comp.minimumQuantity}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1.5px solid #d1d5db',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: comp.quantity <= comp.minimumQuantity ? 'not-allowed' : 'pointer',
                        opacity: comp.quantity <= comp.minimumQuantity ? 0.4 : 1
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontSize: '16px', fontWeight: '800', width: '20px', textAlign: 'center' }}>{comp.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateComponentQty(idx, 1)}
                      disabled={comp.quantity >= comp.maximumQuantity}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1.5px solid #d1d5db',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: comp.quantity >= comp.maximumQuantity ? 'not-allowed' : 'pointer',
                        opacity: comp.quantity >= comp.maximumQuantity ? 0.4 : 1
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-modal-total" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Total: KES {getCustomizedComboTotal()}</strong>
            </div>

            <button
              className="cart-modal-btn"
              onClick={handleAddCustomizedCombo}
              style={{
                width: '100%',
                background: '#f97316',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '15px',
                marginTop: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)'
              }}
            >
              Add to Basket
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Restaurants;