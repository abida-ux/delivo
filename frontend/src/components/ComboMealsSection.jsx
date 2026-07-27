import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import api from '../services/api';
import { resolveImageUrl, handleImageError } from '../utils/placeholderImage';
import './ComboMealsSection.css';

const ComboMealsSection = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const res = await api.get('/combinations');
        const raw = res.data.data || [];
        const processed = raw.map(combo => {
          let price = combo.price;
          if (price == null || price === 0) {
            price = (combo.components || []).reduce((sum, comp) => {
              const unitPrice = comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || 0);
              return sum + unitPrice * (comp.defaultQuantity || 1);
            }, 0);
          }
          return { ...combo, price };
        });
        setCombos(processed);
      } catch (err) {
        console.error('Failed to fetch combos for home page:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCombos();
  }, []);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
    }
  };

  if (!loading && combos.length === 0) return null;

  return (
    <section className="combo-section">
      <div className="combo-section-inner">
        <div className="combo-section-header">
          <div>
            <div className="combo-section-label">
              <Layers size={18} />
              <span>Combo Meals</span>
            </div>
            <h2 className="combo-section-title">Mix &amp; Match Favourites</h2>
            <p className="combo-section-sub">Curated meal combinations — more food, better value</p>
          </div>
          <div className="combo-scroll-controls">
            <button className="combo-arrow-btn" onClick={() => scroll('left')} aria-label="Previous">
              <ChevronLeft size={20} />
            </button>
            <button className="combo-arrow-btn" onClick={() => scroll('right')} aria-label="Next">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#9ca3af', padding: '20px 0' }}>Loading combo meals...</p>
        ) : (
          <div className="combo-carousel" ref={scrollRef}>
            {combos.map(combo => {
              const componentNames = (combo.components || [])
                .map(c => c.foodId?.name || '')
                .filter(Boolean)
                .join(' + ');
              return (
                <div
                  key={combo._id}
                  className="combo-card-home"
                  onClick={() => navigate(`/food/${combo._id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/food/${combo._id}`)}
                >
                  <div className="combo-card-img-wrap">
                    <img
                      src={resolveImageUrl(combo.image)}
                      alt={combo.name}
                      onError={handleImageError}
                    />
                    <span className="combo-card-badge">
                      <Layers size={11} style={{ marginRight: '3px', display: 'inline', verticalAlign: 'middle' }} />
                      Combo
                    </span>
                  </div>
                  <div className="combo-card-body">
                    <h3 className="combo-card-name">{combo.name}</h3>
                    {componentNames && (
                      <p className="combo-card-components">{componentNames}</p>
                    )}
                    <div className="combo-card-price">
                      KES {Number(combo.price).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ComboMealsSection;
