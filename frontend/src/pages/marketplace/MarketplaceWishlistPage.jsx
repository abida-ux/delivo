import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function MarketplaceWishlistPage() {
  const navigate = useNavigate();

  return (
    <div className="home-wrapper">
      <div className="home-inner" style={{ paddingTop: 'var(--space-4)' }}>
        <div className="section-title-block" style={{ padding: 0 }}>
          <h1 className="section-title">Saved Marketplace Items</h1>
          <p className="section-subtitle">Your wishlisted products across categories</p>
        </div>

        <div className="home-section" style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: 'var(--space-4)' }}>
          <Heart size={44} color="var(--color-orange)" style={{ marginBottom: 12 }} />
          <h3>Your Marketplace Wishlist is Empty</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>
            Save items as you shop to easily find them later.
          </p>
          <button className="btn-primary" onClick={() => navigate('/marketplace')}>
            Explore Marketplace
          </button>
        </div>
      </div>
    </div>
  );
}
