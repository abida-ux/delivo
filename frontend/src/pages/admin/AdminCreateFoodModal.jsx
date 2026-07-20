import {useState} from 'react';
import { X } from 'lucide-react';
import './AdminEditFoodModal.css';

const AdminCreateFoodModal = ({ isOpen, restaurants, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    image: '',
    restaurants: [],
    description: '',
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.restaurants.length) {
      alert('Please select at least one restaurant');
      return;
    }
    if (!formData.name.trim()) {
      alert('Please enter food name');
      return;
    }
    if (!formData.price) {
      alert('Please enter price');
      return;
    }
    if (!formData.category.trim()) {
      alert('Please enter category');
      return;
    }
    if (!formData.image.trim()) {
      alert('Please enter image URL');
      return;
    }
    if (!formData.description.trim()) {
      alert('Please enter food description');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        restaurant: formData.restaurants[0],
        restaurants: formData.restaurants,
      };
      console.log('📝 Submitting food data:', payload);
      const result = await onSave(payload);
      
      // Only close if save was successful
      if (result !== false) {
        onClose();
        // Reset form
        setFormData({
          name: '',
          price: '',
          category: '',
          image: '',
          restaurants: [],
          description: '',
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
          <h2>Add New Food Item</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="restaurants">Restaurants *</label>
            <select
              id="restaurants"
              name="restaurants"
              multiple
              value={formData.restaurants}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                setFormData((prev) => ({ ...prev, restaurants: selected }));
              }}
              required
            >
              {restaurants.map((restaurant) => (
                <option key={restaurant._id} value={restaurant._id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
            <small>Select one or more restaurants where this food is available.</small>
          </div>

          <div className="form-group">
            <label htmlFor="name">Food Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter food name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (Ksh) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter price"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="E.g., Main Course"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="image">Image URL *</label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter food description"
              rows="3"
              required
            />
          </div>

          <div className="image-preview">
            {formData.image && (
              <>
                <p className="preview-label">Preview:</p>
                <img
                  src={formData.image}
                  alt="Food preview"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/200x150?text=Invalid+Image';
                  }}
                />
              </>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Creating...' : 'Create Food'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateFoodModal;
