import { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import './AdminEditRestaurantModal.css';

const AdminEditRestaurantModal = ({ isOpen, restaurant, users = [], onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    deliveryTime: '',
    bannerImage: '',
    ownerId: '',
    isOpen: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine || '',
        deliveryTime: restaurant.deliveryTime || '30 mins',
        bannerImage: restaurant.bannerImage || '',
        ownerId: restaurant.ownerId || '',
        isOpen: restaurant.isOpen !== undefined ? restaurant.isOpen : true,
      });
    }
  }, [restaurant]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert cuisine string to array
      const updateData = {
        ...formData,
        cuisine: formData.cuisine.split(',').map(c => c.trim()).filter(c => c),
      };
      await onSave(updateData);
      onClose();
    } catch (error) {
      console.error('Error saving restaurant:', error);
      alert('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Restaurant</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="name">Restaurant Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter restaurant name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cuisine">Cuisine Types *</label>
              <input
                type="text"
                id="cuisine"
                name="cuisine"
                value={formData.cuisine}
                onChange={handleChange}
                placeholder="e.g. Italian, Pizza, Fast Food (comma-separated)"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="deliveryTime">Delivery Time *</label>
              <input
                type="text"
                id="deliveryTime"
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleChange}
                placeholder="e.g. 30 mins, 45 mins"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bannerImage">Banner Image URL *</label>
            <input
              type="url"
              id="bannerImage"
              name="bannerImage"
              value={formData.bannerImage}
              onChange={handleChange}
              placeholder="Enter image URL"
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '4px' }}>
            <label htmlFor="ownerId" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} color="#16a34a" />
              <span>Assign Restaurant Owner (Select User)</span>
            </label>
            <select
              id="ownerId"
              name="ownerId"
              value={formData.ownerId}
              onChange={handleChange}
              style={{
                borderColor: formData.ownerId ? '#16a34a' : '#cbd5e1',
                backgroundColor: formData.ownerId ? '#f0fdf4' : '#fff',
              }}
            >
              <option value="">-- No Owner Linked --</option>
              {users
                .filter((u) => u.role === 'restaurant' || (restaurant && (restaurant.ownerId === u._id || restaurant.ownerId?._id === u._id)))
                .map((u) => {
                  const isCurrent = restaurant && (restaurant.ownerId === u._id || restaurant.ownerId?._id === u._id);
                  return (
                    <option key={u._id} value={u._id}>
                      {u.name || 'Unnamed User'} ({u.email}) {isCurrent ? '✓ (Current Owner)' : ''}
                    </option>
                  );
                })}
            </select>
            <p className="field-hint" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
              Only accounts with role "Restaurant Owner" are listed. Admins can update or reassign owners anytime.
            </p>
          </div>

          {formData.bannerImage && (
            <div className="image-preview">
              <img 
                src={formData.bannerImage} 
                alt="Banner preview"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/500x250?text=Image+Not+Found';
                }}
              />
            </div>
          )}

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="isOpen"
              name="isOpen"
              checked={formData.isOpen}
              onChange={handleChange}
            />
            <label htmlFor="isOpen">Restaurant is Open</label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditRestaurantModal;
