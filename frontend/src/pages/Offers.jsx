import { useState, useContext, useEffect } from 'react';
import { Sparkles, AlertCircle, Copy, Check, Lock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { AuthModalContext } from '../context/AuthModalContext';
import api from '../services/api';
import './Offers.css';

const Offers = () => {
  const { user } = useContext(AuthContext);
  const { openLoginModal } = useContext(AuthModalContext);
  const [copiedCode, setCopiedCode] = useState('');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/offers');
        const list = res.data.data || [];
        setOffers(list);

        // Mark as seen immediately if logged in
        if (user) {
          localStorage.setItem('delivo_seen_offers_count', list.length.toString());
          window.dispatchEvent(new Event('delivo_offers_viewed'));
        }
      } catch (err) {
        console.error('Error fetching offers:', err);
        setError('Failed to load offers');
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, [user]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  if (loading) {
    return (
      <div className="offers-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--delivo-text-muted, #64748b)' }}>Loading active offers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="offers-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: 12 }}>
        <AlertCircle size={28} style={{ color: '#ef4444' }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  // Canonical Delivo Login/Signup Prompt for anonymous visitors
  if (!user) {
    return (
      <div className="offers-page anonymous">
        <div className="auth-pitch-card">
          <div className="lock-icon-wrapper">
            <Lock size={20} />
          </div>
          <h2>Unlock Exclusive Deals</h2>
          <p>
            Sign in or create an account to view coupon codes, copy special promo codes, and start saving on your orders.
          </p>
          <button 
            type="button"
            className="auth-pitch-btn" 
            onClick={openLoginModal}
          >
            Sign In / Create Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="offers-page">
      <div className="offers-header-section">
        <Sparkles className="sparkles-icon" size={20} />
        <h1>Exclusive Offers</h1>
        <p>Unlock the best deals, discounts, and culinary promotions near you.</p>
      </div>

      <div className="offers-content-wrapper">
        <div className="offers-grid">
          {offers.map((offer) => (
            <div key={offer.code} className="offer-card">
              <div className="offer-card-top">
                <span className="offer-discount-badge">{offer.discount}</span>
                <span className="offer-expiry">{offer.expiry}</span>
              </div>
              <div className="offer-card-body">
                <h3>{offer.title}</h3>
                <p>{offer.description}</p>
                <div className="promo-code-container">
                  <div className="promo-code-box">
                    <code>{offer.code}</code>
                  </div>
                  <button 
                    type="button"
                    className={`copy-btn ${copiedCode === offer.code ? 'copied' : ''}`}
                    onClick={() => handleCopy(offer.code)}
                  >
                    {copiedCode === offer.code ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Offers;
