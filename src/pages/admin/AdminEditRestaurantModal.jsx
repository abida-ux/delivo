import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './AdminEditRestaurantModal.css';

const AdminEditRestaurantModal = ({ isOpen, restaurant, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    deliveryTime: '',
    bannerImage: '',
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
