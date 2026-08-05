import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';
import { getMarketplaceCategories } from '../../services/api';

export default function MarketplaceCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getMarketplaceCategories();
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        setCategories([
          { slug: 'supermarket', name: 'Supermarket & Essentials', icon: '🛒', description: 'Detergents, paper products, provisions, household cleaning' },
          { slug: 'groceries', name: 'Fresh Groceries & Farm', icon: '🥦', description: 'Farm fresh vegetables, seasonal fruits, herbs & organic produce' },
          { slug: 'pharmacy', name: 'Pharmacy & Healthcare', icon: '💊', description: 'Over-the-counter meds, first aid, supplements & wellness' },
          { slug: 'beauty', name: 'Beauty & Personal Care', icon: '✨', description: 'Skincare, perfumes, grooming tools, cosmetics & hair products' },
          { slug: 'electronics', name: 'Electronics & Mobile', icon: '⚡', description: 'Smartphones, earbuds, powerbanks, chargers & smart tech' },
          { slug: 'fashion', name: 'Fashion & Apparel', icon: '👗', description: 'Casual wear, shoes, bags, accessories & trendy apparel' },
        ]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-wrapper">
      <div className="section-title-block" style={{ paddingTop: 'var(--space-6)' }}>
        <h1 className="section-title">Marketplace Categories</h1>
        <p className="section-subtitle">Browse products by category</p>
      </div>

      <div className="home-inner">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>Loading categories...</div>
        ) : (
          <div className="foods-grid" style={{ padding: 0 }}>
            {categories.map((cat) => (
              <div
                key={cat._id || cat.slug}
                className="food-menu-card"
                onClick={() => navigate(`/marketplace/category/${cat.slug || cat.categoryType}`)}
                style={{ cursor: 'pointer', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>{cat.icon || '🛍️'}</div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {cat.name}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                  {cat.description || 'Quality curated marketplace items'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-orange)', fontSize: 'var(--text-xs)', fontWeight: 600, marginTop: 'auto' }}>
                  <span>Explore Category</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
