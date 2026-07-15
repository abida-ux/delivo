import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!restaurantId) {
      setError('No restaurant selected');
      return;
    }
    fetchRestaurantData();
  }, [restaurantId]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch restaurant details
      const restaurantData = await getRestaurantById(restaurantId);
      setRestaurant(restaurantData);

      // Fetch foods for this restaurant
      const foodsData = await getFoodsByRestaurant(restaurantId);
      setFoods(foodsData);

      // Extract unique categories from foods
      const uniqueCategories = [...new Set(foodsData.map(food => food.category))];
      setCategories(uniqueCategories);
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

  const handleAddToCart = (food) => {
    addItem(food, 1);
  };

  const handleRemoveFromCart = (foodId) => {
    removeItem(foodId);
  };

  const handleUpdateQuantity = (foodId, newQuantity) => {
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
    return foods.filter(food => food.category === category);
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
            <span className={`res-status-tag ${restaurant.isOpen ? 'open' : 'closed'}`}>
              {restaurant.isOpen ? "Open Now" : "Closed"}
            </span>
            <span className="res-delivery-badge">
              <ShieldCheck size={14} /> Delivo Verified
            </span>
          </div>

          <h1 className="res-brand-title">{restaurant.name}</h1>
          <p className="res-cuisine-subtext">{restaurant.cuisine?.join(' • ') || 'Restaurant'}</p>
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
          onClick={() => setShowCheckout(true)}
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
    </div>
  );
};

export default Restaurants;