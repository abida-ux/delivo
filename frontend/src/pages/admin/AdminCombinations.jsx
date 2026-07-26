import { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, Loader, Layers, X, Trash } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import api from '../../services/api';
import './AdminCombinations.css';

const AdminCombinations = () => {
  const [combinations, setCombinations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalogFoods, setCatalogFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCombo, setCurrentCombo] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    categories: [],
    components: [],
    isEnabled: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [combosRes, catsRes, foodsRes] = await Promise.all([
        api.get('/combinations'),
        api.get('/categories'),
        api.get('/foods'),
      ]);
      setCombinations(combosRes.data.data || []);
      setCategories(catsRes.data.data || []);
      setCatalogFoods(foodsRes.data.data || []);
    } catch (error) {
      console.error('Error loading combinations database:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (combo = null) => {
    if (combo) {
      setCurrentCombo(combo);
      setFormData({
        name: combo.name,
        description: combo.description || '',
        image: combo.image,
        categories: combo.categories.map(c => typeof c === 'object' ? c._id : c),
        components: combo.components.map(comp => ({
          foodId: comp.foodId?._id || comp.foodId,
          defaultQuantity: comp.defaultQuantity,
          minimumQuantity: comp.minimumQuantity,
          maximumQuantity: comp.maximumQuantity,
          isOptional: comp.isOptional || false,
        })),
        isEnabled: combo.isEnabled !== undefined ? combo.isEnabled : true,
      });
    } else {
      setCurrentCombo(null);
      setFormData({
        name: '',
        description: '',
        image: '',
        categories: [],
        components: [{ foodId: '', defaultQuantity: 1, minimumQuantity: 0, maximumQuantity: 5, isOptional: false }],
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

  const handleCategoryToggle = (categoryId) => {
    const isSelected = formData.categories.includes(categoryId);
    setFormData({
      ...formData,
      categories: isSelected
        ? formData.categories.filter(id => id !== categoryId)
        : [...formData.categories, categoryId],
    });
  };

  const handleComponentChange = (index, field, value) => {
    const updated = [...formData.components];
    updated[index] = {
      ...updated[index],
      [field]: field === 'isOptional' ? value : field === 'foodId' ? value : parseInt(value, 10) || 0,
    };
    setFormData({ ...formData, components: updated });
  };

  const addComponentRow = () => {
    setFormData({
      ...formData,
      components: [
        ...formData.components,
        { foodId: '', defaultQuantity: 1, minimumQuantity: 0, maximumQuantity: 5, isOptional: false },
      ],
    });
  };

  const removeComponentRow = (index) => {
    setFormData({
      ...formData,
      components: formData.components.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.components.length === 0) {
      alert('Please add at least one component to the combination meal.');
      return;
    }
    if (formData.components.some(c => !c.foodId)) {
      alert('Please select a food item for all components.');
      return;
    }

    try {
      if (currentCombo) {
        await api.put(`/combinations/${currentCombo._id}`, formData);
      } else {
        await api.post('/combinations', formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save combination');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this combination meal template? All restaurant links for this combination will also be deleted.')) return;
    try {
      await api.delete(`/combinations/${id}`);
      fetchData();
    } catch (error) {
      alert('Failed to delete combination');
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="admin-combos-container">
        <div className="combos-header">
          <div>
            <h2>Combination Meals (Combo Builder)</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              Create set meals (e.g. Ugali & Beef) by combining existing single food items from the catalogue.
            </p>
          </div>
          <button className="add-combo-btn" onClick={() => handleOpenModal()}>
            <Plus size={20} /> Build Combo Meal
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <Loader className="animate-spin" size={48} style={{ color: '#f97316' }} />
          </div>
        ) : (
          <div className="combos-grid">
            {combinations.map((combo) => (
              <div key={combo._id} className="combo-card">
                <img
                  src={combo.image || 'https://via.placeholder.com/320x180?text=Combination+Meal'}
                  alt={combo.name}
                  className="combo-card-image"
                />
                <div className="combo-card-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} style={{ color: '#f97316' }} />
                    <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#f97316', background: 'rgba(249, 115, 22, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      Combo Meal
                    </span>
                  </div>
                  <div className="combo-card-title" style={{ marginTop: '4px' }}>
                    <h3>{combo.name}</h3>
                    {combo.description && (
                      <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>{combo.description}</p>
                    )}
                  </div>

                  <div className="combo-components-list">
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '4px' }}>
                      Combo Components:
                    </span>
                    {combo.components.map((comp, idx) => (
                      <div key={idx} className="combo-component-item">
                        <span>• {comp.foodId?.name || 'Unknown Food'}</span>
                        <span style={{ color: '#6b7280' }}>
                          Qty: {comp.defaultQuantity} (Min: {comp.minimumQuantity}, Max: {comp.maximumQuantity})
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="combo-card-actions">
                    <button className="edit-btn" onClick={() => handleOpenModal(combo)}>
                      <Edit size={16} /> Edit combo
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(combo._id)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div className="combo-modal-overlay" onClick={handleCloseModal}>
            <div className="combo-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{currentCombo ? 'Edit Combo Meal' : 'Build Combo Meal'}</h3>
                <button className="close-modal-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>
              <div className="combo-modal-body">
                <form className="category-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Meal Combination Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="E.g., Ugali & Beef Stew"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="E.g., Soft Ugali served with dry fry beef stew"
                    />
                  </div>

                  <div className="form-group">
                    <label>Combo Image URL *</label>
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      placeholder="https://example.com/combo-photo.jpg"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Assigned Categories</label>
                    <div className="categories-select-grid">
                      {categories.map(cat => (
                        <div
                          key={cat._id}
                          className={`category-chip-select ${formData.categories.includes(cat._id) ? 'selected' : ''}`}
                          onClick={() => handleCategoryToggle(cat._id)}
                        >
                          {cat.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="components-section">
                    <h4>Add Ingredients / Component Foods</h4>
                    {formData.components.map((comp, index) => (
                      <div key={index} className="component-builder-row">
                        <select
                          value={comp.foodId}
                          onChange={(e) => handleComponentChange(index, 'foodId', e.target.value)}
                        >
                          <option value="">-- Select Food Item --</option>
                          {catalogFoods.map(food => (
                            <option key={food._id} value={food._id}>
                              {food.name}
                            </option>
                          ))}
                        </select>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>Default Qty</span>
                          <input
                            type="number"
                            min="0"
                            value={comp.defaultQuantity}
                            onChange={(e) => handleComponentChange(index, 'defaultQuantity', e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>Min Qty</span>
                          <input
                            type="number"
                            min="0"
                            value={comp.minimumQuantity}
                            onChange={(e) => handleComponentChange(index, 'minimumQuantity', e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>Max Qty</span>
                          <input
                            type="number"
                            min="1"
                            value={comp.maximumQuantity}
                            onChange={(e) => handleComponentChange(index, 'maximumQuantity', e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>Optional?</span>
                          <input
                            type="checkbox"
                            checked={comp.isOptional}
                            onChange={(e) => handleComponentChange(index, 'isOptional', e.target.checked)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </div>

                        <button
                          type="button"
                          className="remove-component-btn"
                          onClick={() => removeComponentRow(index)}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="add-component-row-btn"
                      onClick={addComponentRow}
                    >
                      <Plus size={16} /> Add another food component
                    </button>
                  </div>

                  <div className="modal-actions" style={{ marginTop: '24px' }}>
                    <button type="button" className="cancel-modal-btn" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="submit-modal-btn">
                      {currentCombo ? 'Save Changes' : 'Build Combination'}
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

export default AdminCombinations;
