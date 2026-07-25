import { useState, useContext } from 'react';
import { Tag, Sparkles, AlertCircle, Copy, Check, Lock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { AuthModalContext } from '../context/AuthModalContext';
import './pages.css';
import './Offers.css';

const Offers = () => {
  const { user } = useContext(AuthContext);
  const { openLoginModal } = useContext(AuthModalContext);
  const [copiedCode, setCopiedCode] = useState('');

  const offers = []; // Dummy offers removed; replace with API data when available

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="offers-page">
      <div className="offers-header-section">
        <Sparkles className="sparkles-icon" style={{ color: '#f97316', marginBottom: 12 }} />
        <h1>Exclusive Offers</h1>
        <p>Unlock the best deals, discounts, and culinary promotions near you.</p>
      </div>

      <div className="offers-content-wrapper">
        {!user ? (
          <div className="locked-offers-container">
            {/* Blurred preview background */}
            <div className="blurred-offers-list">
              {offers.slice(0, 2).map((offer, idx) => (
                <div key={idx} className="offer-card blurred">
                  <div className="offer-card-top">
                    <span className="offer-discount-badge">{offer.discount}</span>
                    <span className="offer-expiry">{offer.expiry}</span>
                  </div>
                  <div className="offer-card-body">
                    <h3>{offer.title}</h3>
                    <p>{offer.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Premium sign-in card overlay */}
            <div className="auth-pitch-overlay">
              <div className="auth-pitch-card">
                <div className="lock-icon-wrapper">
                  <Lock size={32} />
                </div>
                <h2>Unlock Exclusive Deals</h2>
                <p>
                  Sign in or create an account to view coupon codes, copy special promo codes, and start saving on your orders.
                </p>
                <button className="auth-pitch-btn" onClick={openLoginModal}>
                  Sign In / Create Account
                </button>
              </div>
            </div>
          </div>
        ) : (
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
                </div>

                <div className="offer-card-footer">
                  <div className="min-order-hint">
                    Min. Order: <strong>{offer.minOrder}</strong>
                  </div>
                  <div 
                    className={`promo-code-box ${copiedCode === offer.code ? 'copied' : ''}`}
                    onClick={() => handleCopy(offer.code)}
                    title="Click to copy coupon code"
                  >
                    <span className="code-text">{offer.code}</span>
                    {copiedCode === offer.code ? (
                      <Check size={16} style={{ color: '#22c55e' }} />
                    ) : (
                      <Copy size={16} className="copy-icon" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;
