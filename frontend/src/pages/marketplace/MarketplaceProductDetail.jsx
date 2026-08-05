import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Plus, Minus, Check } from 'lucide-react';
import api from '../../services/api';
import { useMarketplaceCart } from '../../contexts/marketplace/MarketplaceCartContext';
import { resolveImageUrl, handleImageError } from '../../utils/placeholderImage';

export default function MarketplaceProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, cartItems, openMarketplaceCart } = useMarketplaceCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/marketplace/products/${id}`).catch(() => null);
      if (res?.data?.data) {
        setProduct(res.data.data);
      } else {
        setProduct({
          _id: id,
          name: 'Wireless Noise-Cancelling Earbuds Pro',
          brand: 'TechPulse Audio',
          category: 'electronics',
          price: 2499,
          originalPrice: 3200,
          description: 'Experience crystal-clear acoustics, active noise cancellation, and up to 30 hours of continuous playback.',
          image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
          rating: '4.8',
          stock: 12,
        });
      }
    } catch (err) {
      console.error('Error loading product details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="food-details-page">
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          Loading details...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="food-details-page">
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <h2>Product Not Found</h2>
          <button className="btn-secondary" onClick={() => navigate('/marketplace')}>
            Return to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const productId = product._id || product.id;
  const isInCart = cartItems.some((item) => (item._id || item.id) === productId);
  const price = Number(product.finalPrice || product.price) || 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const handleGoToCart = () => {
    openMarketplaceCart();
  };

  return (
    <div className="food-details-page">
      <div className="food-details-back-bar">
        <div className="food-details-back-inner">
          <button className="food-details-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="food-details-content">
        <div className="food-details-inner">
          <div className="food-details-image-wrap">
            <img
              src={resolveImageUrl(product.image || product.images?.[0])}
              alt={product.name}
              className="food-details-image"
              onError={handleImageError}
            />
          </div>

          <div className="food-details-info">
            <h1 className="food-details-name">{product.name}</h1>
            <div className="food-details-restaurant">
              <span>Brand / Store:</span>
              <span className="food-details-restaurant-link">{product.brand || 'Verified Merchant'}</span>
            </div>

            <div className="food-details-price">
              KES {price.toFixed(2)}
            </div>

            <p className="food-details-description">
              {product.description}
            </p>

            <div className="food-details-divider" />

            <div className="food-details-order-row">
              <div className="food-qty-stepper">
                <button
                  className="food-qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus size={14} />
                </button>
                <span className="food-qty-val">{quantity}</span>
                <button
                  className="food-qty-btn"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>

              {isInCart ? (
                <button className="food-add-cart-btn" onClick={handleGoToCart}>
                  View in Cart
                </button>
              ) : (
                <button
                  className="food-add-cart-btn"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
