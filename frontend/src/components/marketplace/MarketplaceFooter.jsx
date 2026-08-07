import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { useMarketplaceCart } from '../../contexts/marketplace/MarketplaceCartContext';
import { LoaderContext } from '../../context/LoaderContext';
import './MarketplaceFooter.css';

export default function MarketplaceFooter() {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useContext(LoaderContext);
  const { openMarketplaceCart } = useMarketplaceCart();

  return (
    <footer className="footer mkt-footer-override">
      <div className="footer-content simplified-footer">
        <div className="footer-column">
          <h4>Delivo Marketplace</h4>
          <p>Supermarket, electronics, pharmacy, and fashion, delivered straight to your door.</p>
        </div>

        <div className="footer-column">
          <h4>Support & Contact</h4>
          <ul>
            <li><a href="mailto:info@delivo.buzz">info@delivo.buzz</a></li>
            <li><a href="tel:+254704060217">+254 704 060 217</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/marketplace">Marketplace Home</Link></li>
            <li><Link to="/marketplace/categories">All Categories</Link></li>
            <li>
              <button className="footer-link-button" type="button" onClick={openMarketplaceCart}>
                My Marketplace Cart
              </button>
            </li>
            <li>
              <button
                className="footer-link-button"
                type="button"
                onClick={() => {
                  showLoader();
                  navigate('/');
                  setTimeout(() => {
                    hideLoader();
                  }, 1500);
                }}
              >
                ← Switch to Food Delivery
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Delivo Marketplace. All rights reserved.</p>
      </div>
    </footer>
  );
}
