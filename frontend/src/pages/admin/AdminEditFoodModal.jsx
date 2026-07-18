import {useState, useEffect} from 'react';
import { X } from 'lucide-react';
import './AdminEditFoodModal.css';

const AdminEditFoodModal = ({ isOpen, food, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    image: '',
    restaurant: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (food) {
      setFormData({
        name: food.name || '',
        price: food.price || '',
        category: food.category || '',
        image: food.image || '',
        restaurant: typeof food.restaurant === 'object' ? food.restaurant?.name : food.restaurant || '',
        description: food.description || '',
      });
    }
  }, [food]);

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
    setLoading(true);
    try {
      // Exclude restaurant from update data since it shouldn't be edited
      const { restaurant, ...updateData } = formData;
      const result = await onSave(updateData);
      
      // Only close if save was successful
      if (result !== false) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Food Item</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
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
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter food description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="restaurant">Restaurant</label>
            <input
              type="text"
              id="restaurant"
              name="restaurant"
              value={formData.restaurant}
              onChange={handleChange}
              placeholder="Restaurant name"
              disabled
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditFoodModal;
