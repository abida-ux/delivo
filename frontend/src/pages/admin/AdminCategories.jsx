import { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, ToggleLeft, ToggleRight, Loader, X } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import api from '../../services/api';
import './AdminCategories.css';


const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    icon: 'Utensils',
    image: '',
    order: 0,
    isEnabled: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setCurrentCategory(category);
      setFormData({
        name: category.name,
        icon: category.icon,
        image: category.image,
        order: category.order || 0,
        isEnabled: category.isEnabled !== undefined ? category.isEnabled : true,
      });
    } else {
      setCurrentCategory(null);
      setFormData({
        name: '',
        icon: 'Utensils',
        image: '',
        order: categories.length,
        isEnabled: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentCategory) {
        await api.put(`/categories/${currentCategory._id}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      fetchCategories();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This does not delete assigned foods.')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (error) {
      alert('Failed to delete category');
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      await api.put(`/categories/${category._id}`, {
        isEnabled: !category.isEnabled,
      });
      fetchCategories();
    } catch (error) {
      alert('Failed to toggle status');
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="admin-categories-container">
        <div className="admin-categories-header">
          <div>
            <h2>Food Categories</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              Create and manage central food categories for multi-restaurant filtering.
            </p>
          </div>
          <button className="add-category-btn" onClick={() => handleOpenModal()}>
            <Plus size={20} /> Add Category
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <Loader className="animate-spin" size={48} style={{ color: '#16a34a' }} />
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category._id} className="category-card">
                <img
                  src={category.image || 'https://via.placeholder.com/300x160?text=No+Category+Image'}
                  alt={category.name}
                  className="category-card-image"
                />
                <div className="category-card-content">
                  <div className="category-card-title">
                    <h3>{category.name}</h3>
                    <span 
                      onClick={() => handleToggleStatus(category)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {category.isEnabled ? (
                        <ToggleRight size={32} style={{ color: '#10b981' }} />
                      ) : (
                        <ToggleLeft size={32} style={{ color: '#d1d5db' }} />
                      )}
                    </span>
                  </div>
                  
                  <div className="category-card-meta">
                    <span>Icon: <strong>{category.icon}</strong></span>
                    <span>Order: <strong>{category.order}</strong></span>
                  </div>

                  <div className="category-card-actions">
                    <button className="edit-btn" onClick={() => handleOpenModal(category)}>
                      <Edit size={16} /> Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(category._id)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div className="category-modal-overlay" onClick={handleCloseModal}>
            <div className="category-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{currentCategory ? 'Edit Category' : 'Create Category'}</h3>
                <button className="close-modal-btn" onClick={handleCloseModal} aria-label="Close modal">
                  <X size={18} />
                </button>

              </div>
              <div className="modal-body">
                <form className="category-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Category Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="E.g., Breakfast"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Lucide Icon Name *</label>
                    <select name="icon" value={formData.icon} onChange={handleInputChange}>
                      <option value="Utensils">Utensils</option>
                      <option value="Coffee">Coffee</option>
                      <option value="CupSoda">CupSoda</option>
                      <option value="Pizza">Pizza</option>
                      <option value="Cookie">Cookie</option>
                      <option value="Flame">Flame</option>
                      <option value="Croissant">Croissant</option>
                      <option value="Soup">Soup</option>
                      <option value="IceCream">IceCream</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Image URL *</label>
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      placeholder="https://example.com/banner.jpg"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Order Position *</label>
                    <input
                      type="number"
                      name="order"
                      value={formData.order}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      name="isEnabled"
                      id="isEnabled"
                      checked={formData.isEnabled}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="isEnabled">Enable Category</label>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="cancel-modal-btn" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="submit-modal-btn">
                      {currentCategory ? 'Save Changes' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminCategories;
