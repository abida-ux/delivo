import { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import api from '../../services/api';
import './AdminEditFoodModal.css';

const AdminCreateFoodModal = ({ isOpen, restaurants, onClose, onSave }) => {
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [createNewCategory, setCreateNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Utensils');
  const [newCategoryImage, setNewCategoryImage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '',
    restaurants: [],
    description: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategoriesList(res.data.data || []);
    } catch (error) {
      console.error('Error fetching categories in modal:', error);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryToggle = (categoryId) => {
    const isSelected = selectedCategories.includes(categoryId);
    setSelectedCategories(isSelected
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
    if (selectedCategories.length === 0 && !newCategoryName.trim()) {
      alert('Please link this food to at least one category or create a new one');
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
      let finalCategories = [...selectedCategories];
      const firstCat = categoriesList.find(c => 
        selectedCategories.includes(c._id) || selectedCategories.includes(c.name)
      );
      let firstCategoryName = firstCat ? firstCat.name : '';

      finalCategories = finalCategories.map(catVal => {
        const found = categoriesList.find(c => c._id === catVal || c.name === catVal);
        return found ? found._id : null;
      }).filter(Boolean);

      if (createNewCategory && newCategoryName.trim()) {
        const catRes = await api.post('/categories', {
          name: newCategoryName.trim(),
          icon: newCategoryIcon,
          image: newCategoryImage.trim() || 'https://via.placeholder.com/300x160?text=Category',
          order: categoriesList.length,
          isEnabled: true,
        });
        if (catRes.data.data?._id) {
          finalCategories.push(catRes.data.data._id);
          firstCategoryName = newCategoryName.trim();
        }
      }

      const payload = {
        ...formData,
        categories: finalCategories,
        category: firstCategoryName || 'Other',
        restaurant: formData.restaurants[0],
        restaurants: formData.restaurants,
      };

      console.log('Submitting food data:', payload);

      const result = await onSave(payload);

      if (result !== false) {
        onClose();
        // Reset form
        setFormData({
          name: '',
          price: '',
          image: '',
          restaurants: [],
          description: '',
        });
        setSelectedCategories([]);
        setCreateNewCategory(false);
        setNewCategoryName('');
        setNewCategoryImage('');
      }
    } catch (err) {
      alert('Error creating food: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto', width: '90%', maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Add New Food Item</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label style={{ fontWeight: '700', marginBottom: '6px', display: 'block' }}>Choose Restaurants *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', background: '#f9fafb', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', maxHeight: '120px', overflowY: 'auto' }}>
              {restaurants.map((restaurant) => (
                <label key={restaurant._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.restaurants.includes(restaurant._id)}
                    onChange={(e) => {
                      const id = restaurant._id;
                      setFormData(prev => {
                        const nextRes = e.target.checked 
                          ? [...prev.restaurants, id]
                          : prev.restaurants.filter(rId => rId !== id);
                        return { ...prev, restaurants: nextRes };
                      });
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  {restaurant.name}
                </label>
              ))}
            </div>
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Select all restaurants selling this food.
            </small>
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

          <div className="form-group">
            <label htmlFor="price">Default Pricing (KSh) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Enter price"
              required
            />
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '700', display: 'block', marginBottom: '6px' }}>Link to Categories</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {categoriesList.map(cat => (
                <button
                  type="button"
                  key={cat._id}
                  onClick={() => handleCategoryToggle(cat._id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: selectedCategories.includes(cat._id) ? '1.5px solid #16a34a' : '1.5px solid #d1d5db',
                    background: selectedCategories.includes(cat._id) ? '#16a34a' : 'white',
                    color: selectedCategories.includes(cat._id) ? 'white' : '#4b5563',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            
            <button
              type="button"
              onClick={() => setCreateNewCategory(!createNewCategory)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#16a34a',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '6px'
              }}
            >
              + Create a New Category
            </button>

            {createNewCategory && (
              <div style={{ border: '1px dashed #16a34a', padding: '16px', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.04)', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#15803d' }}>New Category Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Category Name *</label>
                    <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="E.g., Snacks" style={{ padding: '8px 12px' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Icon *</label>
                    <select value={newCategoryIcon} onChange={e => setNewCategoryIcon(e.target.value)} style={{ padding: '8px 12px' }}>
                      <option value="Utensils">Utensils</option>
                      <option value="Coffee">Coffee</option>
                      <option value="CupSoda">CupSoda</option>
                      <option value="Pizza">Pizza</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Image URL</label>
                  <input type="url" value={newCategoryImage} onChange={e => setNewCategoryImage(e.target.value)} placeholder="https://example.com/banner.jpg" style={{ padding: '8px 12px' }} />
                </div>
              </div>
            )}
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

          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Creating...' : 'Create Food Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateFoodModal;
