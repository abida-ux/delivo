import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CATEGORIES_LIST = [
  { id: 'supermarket', name: 'Supermarket & Essentials', icon: '🛒', desc: 'Detergents, paper products, provisions, household cleaning' },
  { id: 'groceries', name: 'Fresh Groceries & Farm', icon: '🥦', desc: 'Farm fresh vegetables, seasonal fruits, herbs & organic produce' },
  { id: 'pharmacy', name: 'Pharmacy & Healthcare', icon: '💊', desc: 'Over-the-counter meds, first aid, supplements & wellness' },
  { id: 'beauty', name: 'Beauty & Personal Care', icon: '✨', desc: 'Skincare, perfumes, grooming tools, cosmetics & hair products' },
  { id: 'electronics', name: 'Electronics & Mobile', icon: '⚡', desc: 'Smartphones, earbuds, powerbanks, chargers & smart tech' },
  { id: 'fashion', name: 'Fashion & Apparel', icon: '👗', desc: 'Casual wear, shoes, bags, accessories & trendy apparel' },
];

export default function MarketplaceCategories() {
  const navigate = useNavigate();

  return (
    <div className="home-wrapper">
      <div className="section-title-block" style={{ paddingTop: 'var(--space-6)' }}>
        <h1 className="section-title">Marketplace Categories</h1>
        <p className="section-subtitle">Browse products by category</p>
      </div>

      <div className="home-inner">
        <div className="foods-grid" style={{ padding: 0 }}>
          {CATEGORIES_LIST.map((cat) => (
            <div
              key={cat.id}
              className="food-menu-card"
              onClick={() => navigate(`/marketplace/category/${cat.id}`)}
              style={{ cursor: 'pointer', padding: 'var(--space-4)' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>{cat.icon}</div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {cat.name}
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                {cat.desc}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-orange)', fontSize: 'var(--text-xs)', fontWeight: 600, marginTop: 'auto' }}>
                <span>Explore</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
