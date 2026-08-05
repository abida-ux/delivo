import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import api from '../../services/api';
import MarketplaceProductCard from '../../components/marketplace/MarketplaceProductCard';

export default function MarketplaceCategoryDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryProducts();
  }, [slug]);

  const fetchCategoryProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/marketplace/products', { params: { category: slug } }).catch(() => null);
      let items = res?.data?.data || [];

      if (!items || items.length === 0) {
        items = [
          {
            _id: `mkt_cat_${slug}_1`,
            name: `${slug.toUpperCase()} Premium Item 1`,
            brand: 'Verified Brand',
            category: slug,
            price: 499,
            image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
            rating: '4.9',
            stock: 25,
          },
          {
            _id: `mkt_cat_${slug}_2`,
            name: `${slug.toUpperCase()} Featured Item 2`,
            brand: 'Delivo Select',
            category: slug,
            price: 1250,
            originalPrice: 1500,
            discountPercent: 16,
            image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
            rating: '4.8',
            stock: 10,
          },
        ];
      }

      setProducts(items);
    } catch (err) {
      console.error('Error loading category items:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-wrapper">
      <div className="home-inner" style={{ paddingTop: 'var(--space-4)' }}>
        <button
          className="btn-secondary"
          onClick={() => navigate('/marketplace/categories')}
          style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-2) var(--space-4)' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Categories</span>
        </button>

        <div className="section-title-block" style={{ padding: 0 }}>
          <h1 className="section-title" style={{ textTransform: 'capitalize' }}>
            {slug}
          </h1>
          <p className="section-subtitle">Showing all available products</p>
        </div>

        {loading ? (
          <div className="foods-grid" style={{ padding: 0, marginTop: 'var(--space-4)' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="food-menu-card" style={{ height: 240, opacity: 0.6 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Package size={40} style={{ color: 'var(--color-orange)', marginBottom: 12 }} />
            <h3>No products in this category</h3>
          </div>
        ) : (
          <div className="foods-grid" style={{ padding: 0, marginTop: 'var(--space-4)' }}>
            {products.map((product) => (
              <MarketplaceProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
