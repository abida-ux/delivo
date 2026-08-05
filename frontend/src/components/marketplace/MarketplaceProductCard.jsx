import { Star, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMarketplaceCart } from '../../contexts/marketplace/MarketplaceCartContext';
import { resolveImageUrl, handleImageError } from '../../utils/placeholderImage';
import './MarketplaceProductCard.css';

export default function MarketplaceProductCard({ product }) {
  const navigate = useNavigate();
  const { addItem, cartItems, openMarketplaceCart } = useMarketplaceCart();

  const productId = product._id || product.id;
  const isInCart = cartItems.some((item) => (item._id || item.id) === productId);
  const price = Number(product.finalPrice || product.price) || 0;

  const handleCardClick = () => {
    navigate(`/marketplace/product/${productId}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addItem(product, 1);
  };

  const handleGoToCart = (e) => {
    e.stopPropagation();
    openMarketplaceCart();
  };

  return (
    <div
      className="food-menu-card marketplace-food-card"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="food-image-wrapper">
        <img
          src={resolveImageUrl(product.image || product.images?.[0])}
          alt={product.name}
          onError={handleImageError}
        />
        <div className="food-badge">
          <Star size={10} fill="currentColor" />
          <span>{product.rating || '4.8'}</span>
        </div>
        {product.discountPercent > 0 && (
          <div className="marketplace-discount-pill">
            -{product.discountPercent}%
          </div>
        )}
      </div>

      <div className="food-details">
        <h3 className="food-name">
          <span>{product.name}</span>
        </h3>
        <p className="food-description">
          {product.brand || product.merchant?.name || product.description || 'Verified product'}
        </p>

        <div className="food-footer">
          <span className="food-price">KES {price.toFixed(2)}</span>
          {isInCart ? (
            <button
              className="go-to-cart-ui"
              onClick={handleGoToCart}
              title="Go to Cart"
            >
              <Check size={16} />
              <span>Go to Cart</span>
            </button>
          ) : (
            <button
              className="add-to-cart-ui"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              title="Add to Cart"
            >
              <Plus size={16} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
