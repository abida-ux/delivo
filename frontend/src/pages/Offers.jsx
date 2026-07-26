import { useState, useContext, useEffect } from 'react';
import { Tag, Sparkles, AlertCircle, Copy, Check, Lock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { AuthModalContext } from '../context/AuthModalContext';
import api from '../services/api';
import './pages.css';
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
        <p style={{ fontSize: 18, fontWeight: 600, color: '#555555' }}>Loading active offers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="offers-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: 16 }}>
        <AlertCircle size={40} style={{ color: '#ef4444' }} />
        <p style={{ fontSize: 18, fontWeight: 600, color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  // Clean Login/Signup CTA directly without headers or background cards for anonymous visitors
  if (!user) {
    return (
      <div className="offers-page anonymous" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '24px' }}>
        <div className="auth-pitch-card" style={{ maxWidth: 440, width: '100%', padding: '40px 32px', textAlign: 'center', background: '#ffffff', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <div className="lock-icon-wrapper" style={{ width: 64, height: 64, margin: '0 auto 24px auto', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111111', marginBottom: 12 }}>Unlock Exclusive Deals</h2>
          <p style={{ fontSize: 15, color: '#666666', lineHeight: 1.6, marginBottom: 32 }}>
            Sign in or create an account to view coupon codes, copy special promo codes, and start saving on your orders.
          </p>
          <button 
            className="auth-pitch-btn" 
            style={{ width: '100%', background: '#f97316', color: '#ffffff', border: 'none', padding: '16px 24px', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease' }}
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
        <Sparkles className="sparkles-icon" style={{ color: '#f97316', marginBottom: 12 }} />
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
                    className={`copy-btn ${copiedCode === offer.code ? 'copied' : ''}`}
                    onClick={() => handleCopy(offer.code)}
                  >
                    {copiedCode === offer.code ? <Check size={16} /> : <Copy size={16} />}
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
