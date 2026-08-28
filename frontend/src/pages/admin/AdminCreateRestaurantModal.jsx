import { useState } from 'react';
import { X, User } from 'lucide-react';
import './AdminEditRestaurantModal.css';

const AdminCreateRestaurantModal = ({ isOpen, users = [], onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    deliveryTime: '30 mins',
    bannerImage: '',
    description: '',
    phone: '',
    email: '',
    ownerId: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerConfirmPassword: '',
    isOpen: true,
  });

  const [loading, setLoading] = useState(false);

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
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter restaurant name');
      return;
    }
    if (!formData.cuisine.trim()) {
      alert('Please enter cuisine types');
      return;
    }
    if (!formData.deliveryTime.trim()) {
      alert('Please enter delivery time');
      return;
    }
    if (!formData.bannerImage.trim()) {
      alert('Please enter banner image URL');
      return;
    }
    
    setLoading(true);
    try {
      // Convert cuisine string to array
      const cuisineArray = formData.cuisine.split(',').map(c => c.trim()).filter(c => c);
      
      if (cuisineArray.length === 0) {
        alert('Please enter at least one cuisine type');
        setLoading(false);
        return;
      }
      
      // Validate owner fields: if creating new owner (ownerId empty) and ownerName provided, require passwords
      if (!formData.ownerId && formData.ownerName) {
        if (!formData.ownerPassword || formData.ownerPassword.length < 6) {
          alert('Owner password must be at least 6 characters');
          setLoading(false);
          return;
        }
        if (formData.ownerPassword !== formData.ownerConfirmPassword) {
          alert('Owner password and confirm password do not match');
          setLoading(false);
          return;
        }
      }

      const newData = {
        ...formData,
        cuisine: cuisineArray,
      };
      
      console.log('Submitting restaurant data:', newData);

      const result = await onSave(newData);
      
      // Only close if save was successful
      if (result !== false) {
        onClose();
        // Reset form
        setFormData({
          name: '',
          cuisine: '',
          deliveryTime: '30 mins',
          bannerImage: '',
          description: '',
          phone: '',
          email: '',
          ownerId: '',
          isOpen: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Restaurant</h2>
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

          <div className="form-group" style={{ marginTop: '8px' }}>
            <label htmlFor="ownerId" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} color="#16a34a" />
              <span>Assign / Create Restaurant Owner</span>
            </label>
            <select
              id="ownerId"
              name="ownerId"
              value={formData.ownerId}
              onChange={handleChange}
              style={{ borderColor: formData.ownerId ? '#16a34a' : '#cbd5e1', backgroundColor: formData.ownerId ? '#f0fdf4' : '#fff' }}
            >
              <option value="">-- Create New Owner --</option>
              {users
                .filter((u) => u.role === 'restaurant')
                .map((u) => (
                  <option key={u._id} value={u._id}>{u.name || u.email || 'Unnamed'} ({u.email})</option>
                ))}
            </select>
            <p className="field-hint" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
              Choose an existing owner account or create a new owner by filling the fields below.
            </p>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '8px' }}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ownerName">Owner Name</label>
                <input type="text" id="ownerName" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Owner full name" />
              </div>
              <div className="form-group">
                <label htmlFor="ownerEmail">Owner Email</label>
                <input type="email" id="ownerEmail" name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} placeholder="owner@example.com (optional)" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ownerPassword">Password</label>
                <input type="password" id="ownerPassword" name="ownerPassword" value={formData.ownerPassword} onChange={handleChange} placeholder="Create password (min 6)" />
              </div>
              <div className="form-group">
                <label htmlFor="ownerConfirmPassword">Confirm Password</label>
                <input type="password" id="ownerConfirmPassword" name="ownerConfirmPassword" value={formData.ownerConfirmPassword} onChange={handleChange} placeholder="Confirm password" />
              </div>
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" />
            </div>
            <div className="form-group">
              <label htmlFor="email">Restaurant Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter restaurant email" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Enter restaurant description" rows="3" />
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
              {loading ? 'Creating...' : 'Create Restaurant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateRestaurantModal;
