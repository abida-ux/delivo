import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react';
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
        const processed = raw.map((combo) => {
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
        {/* Header */}
        <div className="combo-section-header">
          <div>
            <h2 className="combo-section-title">Chef's Special Bundles</h2>
            <p className="combo-section-sub">Perfectly paired meals crafted for maximum flavor</p>
          </div>

          <div className="combo-scroll-controls">
            <button className="combo-arrow-btn" onClick={() => scroll('left')} aria-label="Previous">
              <ChevronLeft size={18} />
            </button>
            <button className="combo-arrow-btn" onClick={() => scroll('right')} aria-label="Next">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="combo-skeleton-row">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="combo-skeleton-card shimmer"></div>
            ))}
          </div>
        ) : (
          <div className="combo-carousel" ref={scrollRef}>
            {combos.map((combo) => {
              const componentNames = (combo.components || [])
                .map((c) => c.foodId?.name || '')
                .filter(Boolean)
                .join(' • ');

              return (
                <div
                  key={combo._id}
                  className="clean-combo-card"
                  onClick={() => navigate(`/food/${combo._id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/food/${combo._id}`)}
                >
                  {/* Clean Dish Image Frame */}
                  <div className="clean-dish-frame">
                    <div className="clean-circle-img-wrap">
                      <img
                        src={resolveImageUrl(combo.image)}
                        alt={combo.name}
                        className="clean-circle-img"
                        onError={handleImageError}
                        loading="lazy"
                      />
                      <button
                        className="clean-floating-plus"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/food/${combo._id}`);
                        }}
                        title="Add Meal"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Clean Minimalist Details */}
                  <div className="clean-card-body">
                    <h3 className="clean-dish-title" title={combo.name}>{combo.name}</h3>

                    {componentNames && (
                      <p className="clean-components-sub">{componentNames}</p>
                    )}

                    <div className="clean-price-row">
                      <span className="clean-price-val">KES {Number(combo.price).toLocaleString('en-KE')}</span>
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
