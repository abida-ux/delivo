import { useState, useEffect } from 'react';
import { Tag, Plus, MapPin, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getSecondHandListings, createSecondHandListing } from '../../services/api';
import './MarketplaceSecondHand.css';

export default function MarketplaceSecondHand() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCondition, setActiveCondition] = useState('All');
  const [showPostModal, setShowPostModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    condition: 'Excellent',
    category: 'Electronics',
    price: '',
    negotiablePrice: true,
    seller: '',
    sellerContact: '',
    location: 'Nairobi, Kenya',
    image: '',
  });

  useEffect(() => {
    fetchListings();
  }, [activeCondition]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = { approvalStatus: 'approved' };
      const data = await getSecondHandListings(params);
      if (data && data.length > 0) {
        setListings(data);
      } else {
        // Fallback sample listings if database is empty initially
        setListings([
          {
            _id: 'sh_1',
            productName: 'Sony WH-1000XM4 Noise Canceling Headphones',
            description: 'Used for 6 months. In pristine condition with original box and cable.',
            condition: 'Excellent',
            price: 18500,
            negotiablePrice: true,
            seller: 'David K.',
            sellerContact: '+254 712 345 678',
            location: 'Kilimani, Nairobi',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
          },
          {
            _id: 'sh_2',
            productName: 'Apple iPad Air 4th Gen (64GB WiFi)',
            description: 'Space Gray. Minor wear on back cover, screen scratch-free.',
            condition: 'Very Good',
            price: 42000,
            negotiablePrice: false,
            seller: 'Sarah M.',
            sellerContact: '+254 722 987 654',
            location: 'Westlands, Nairobi',
            image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
          },
          {
            _id: 'sh_3',
            productName: 'Dell XPS 13 i7 16GB RAM 512GB SSD',
            description: 'Ultraportable laptop. Battery holds 4+ hours.',
            condition: 'Good',
            price: 58000,
            negotiablePrice: true,
            seller: 'TechHub Deals',
            sellerContact: '+254 700 112 233',
            location: 'CBD, Nairobi',
            image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching second hand listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSecondHandListing({
        ...formData,
        price: Number(formData.price || 0),
        approvalStatus: 'pending', // Requires admin approval
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowPostModal(false);
        setFormData({
          productName: '',
          description: '',
          condition: 'Excellent',
          category: 'Electronics',
          price: '',
          negotiablePrice: true,
          seller: '',
          sellerContact: '',
          location: 'Nairobi, Kenya',
          image: '',
        });
      }, 2000);
    } catch (err) {
      console.error('Error submitting listing:', err);
    }
  };

  const filteredListings = activeCondition === 'All'
    ? listings
    : listings.filter((item) => item.condition === activeCondition);

  return (
    <div className="secondhand-page">
      <div className="secondhand-inner">
        <div className="secondhand-header">
          <div>
            <h1 className="secondhand-title">Pre-Owned & Second-Hand Marketplace</h1>
            <p className="secondhand-subtitle">Verified pre-owned electronics, gadgets, and home goods with buyer protection.</p>
          </div>
          <button className="secondhand-post-btn" onClick={() => setShowPostModal(true)}>
            <Plus size={18} />
            <span>Sell Pre-Owned Item</span>
          </button>
        </div>

        <div className="secondhand-filter-bar">
          <div className="secondhand-tabs">
            {['All', 'Excellent', 'Very Good', 'Good', 'Fair'].map((cond) => (
              <button
                key={cond}
                className={`secondhand-tab ${activeCondition === cond ? 'active' : ''}`}
                onClick={() => setActiveCondition(cond)}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>Loading listings...</div>
        ) : (
          <div className="secondhand-grid">
            {filteredListings.map((item) => (
              <div key={item._id} className="secondhand-card">
                <div className="secondhand-img-wrap">
                  <img src={item.image || 'https://via.placeholder.com/400'} alt={item.productName} className="secondhand-img" />
                  <span className="secondhand-condition-badge">{item.condition}</span>
                </div>
                <div className="secondhand-body">
                  <h3 className="secondhand-name">{item.productName}</h3>
                  <p className="secondhand-desc">{item.description}</p>

                  <div className="secondhand-seller-info">
                    <MapPin size={12} />
                    <span>{item.location}</span>
                  </div>

                  <div className="secondhand-price-row">
                    <span className="secondhand-price">KES {Number(item.price).toLocaleString()}</span>
                    {item.negotiablePrice && <span className="secondhand-neg">Negotiable</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPostModal && (
        <div className="secondhand-modal-backdrop" onClick={() => setShowPostModal(false)}>
          <div className="secondhand-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Post Item for Sale</h3>
            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: 18, color: '#0f172a' }}>Listing Submitted!</h4>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Your listing is under review by Delivo Admin and will appear once approved.</p>
              </div>
            ) : (
              <form onSubmit={handlePostSubmit}>
                <div className="secondhand-form-field">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iPhone 13 Pro Max 256GB"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  />
                </div>
                <div className="secondhand-form-field">
                  <label>Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe condition, usage history, included accessories..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="secondhand-form-field">
                    <label>Condition *</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Very Good">Very Good</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                    </select>
                  </div>
                  <div className="secondhand-form-field">
                    <label>Price (KES) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 25000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="secondhand-form-field">
                  <label>Image URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="secondhand-form-field">
                    <label>Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Seller Name"
                      value={formData.seller}
                      onChange={(e) => setFormData({ ...formData, seller: e.target.value })}
                    />
                  </div>
                  <div className="secondhand-form-field">
                    <label>Phone Contact *</label>
                    <input
                      type="text"
                      required
                      placeholder="+254 7..."
                      value={formData.sellerContact}
                      onChange={(e) => setFormData({ ...formData, sellerContact: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button type="button" className="return-btn-cancel" style={{ flex: 1, padding: 12 }} onClick={() => setShowPostModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="secondhand-post-btn" style={{ flex: 1.2, justifyContent: 'center' }}>
                    Submit for Approval
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
