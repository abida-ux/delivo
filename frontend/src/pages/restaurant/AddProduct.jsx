import React, { useState } from 'react';
import { Upload, Plus, X } from 'lucide-react';
import '../pages.css';
import './AddProduct.css';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Pizzas',
    price: '',
    description: '',
    preparationTime: '',
    spicy: 'no',
    vegetarian: false,
    image: null
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const categories = ['Pizzas', 'Starters', 'Salads', 'Drinks', 'Desserts', 'Main Course'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate submission
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({
        name: '',
        category: 'Pizzas',
        price: '',
        description: '',
        preparationTime: '',
        spicy: 'no',
        vegetarian: false,
        image: null
      });
      setImagePreview(null);
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div className="add-product">
      <div className="page-header">
        <h1>Add New Product</h1>
        <p>Create a new menu item for your restaurant</p>
      </div>

      {submitted && (
        <div className="success-message">
          ✓ Product added successfully!
        </div>
      )}

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Product Information</h2>

            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Margherita Pizza"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Price ($) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your product..."
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Preparation Time (mins)</label>
                <input
                  type="number"
                  name="preparationTime"
                  value={formData.preparationTime}
                  onChange={handleInputChange}
                  placeholder="15"
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Spice Level</label>
                <select
                  name="spicy"
                  value={formData.spicy}
                  onChange={handleInputChange}
                >
                  <option value="no">Not Spicy</option>
                  <option value="mild">Mild</option>
                  <option value="medium">Medium</option>
                  <option value="hot">Hot</option>
                </select>
              </div>
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="vegetarian"
                  checked={formData.vegetarian}
                  onChange={handleInputChange}
                />
                Vegetarian
              </label>
            </div>
          </div>

          <div className="form-section">
            <h2>Product Image</h2>

            <div className="image-upload">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData({ ...formData, image: null });
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <label className="upload-area">
                  <Upload size={32} />
                  <p>Click to upload product image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    hidden
                  />
                </label>
              )}
            </div>
          </div>

          <button type="submit" className="submit-btn">
            <Plus size={20} />
            Add Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
