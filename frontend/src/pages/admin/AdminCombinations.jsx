import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit, Plus, Loader, Layers, X, Trash, Tag } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import api from '../../services/api';
import './AdminCombinations.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate a combo name from the selected food objects */
const buildAutoName = (components, catalogFoods) => {
  const names = components
    .map(c => {
      const food = catalogFoods.find(f => f._id === c.foodId);
      return food ? food.name : null;
    })
    .filter(Boolean);
  return names.length ? names.join(' & ') : '';
};

/** Calculate the total combo price from selected components */
const calcTotalPrice = (components, catalogFoods) => {
  return components.reduce((sum, comp) => {
    if (!comp.foodId) return sum;
    const food = catalogFoods.find(f => f._id === comp.foodId);
    const unitPrice = comp.customPrice !== '' && comp.customPrice !== undefined && comp.customPrice !== null
      ? Number(comp.customPrice)
      : (food?.price || 0);
    return sum + unitPrice * (comp.defaultQuantity || 1);
  }, 0);
};

// ─── Component ───────────────────────────────────────────────────────────────

const AdminCombinations = () => {
  const [combinations, setCombinations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalogFoods, setCatalogFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCombo, setCurrentCombo] = useState(null);
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);

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

  // ── Auto-update name whenever components change (if name hasn't been manually edited) ──
  const syncAutoName = useCallback(
    (components, nameManual, currentName) => {
      if (nameManual) return currentName; // user typed a custom name → keep it
      return buildAutoName(components, catalogFoods);
    },
    [catalogFoods]
  );

  const handleOpenModal = (combo = null) => {
    if (combo) {
      setCurrentCombo(combo);
      setIsNameManuallyEdited(true);
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
          customPrice: comp.customPrice !== undefined ? comp.customPrice : '',
        })),
        isEnabled: combo.isEnabled !== undefined ? combo.isEnabled : true,
      });
    } else {
      setCurrentCombo(null);
      setIsNameManuallyEdited(false);
      setFormData({
        name: '',
        description: '',
        image: '',
        categories: [],
        components: [{ foodId: '', defaultQuantity: 1, minimumQuantity: 0, maximumQuantity: 5, isOptional: false, customPrice: '' }],
        isEnabled: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'name') {
      setIsNameManuallyEdited(value.trim() !== '');
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const handleComponentChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.components];
      let parsedVal = value;
      if (field === 'customPrice') {
        parsedVal = value === '' ? '' : parseFloat(value);
        if (isNaN(parsedVal)) parsedVal = '';
      } else if (field !== 'isOptional' && field !== 'foodId') {
        parsedVal = parseInt(value, 10) || 0;
      }
      updated[index] = { ...updated[index], [field]: parsedVal };

      // Auto-generate name when a food is selected (if name not manually edited)
      let newName = prev.name;
      if (field === 'foodId' && !isNameManuallyEdited) {
        newName = buildAutoName(updated, catalogFoods);
      }

      return { ...prev, components: updated, name: newName };
    });
  };

  const addComponentRow = () => {
    setFormData(prev => ({
      ...prev,
      components: [
        ...prev.components,
        { foodId: '', defaultQuantity: 1, minimumQuantity: 0, maximumQuantity: 5, isOptional: false, customPrice: '' },
      ],
    }));
  };

  const removeComponentRow = (index) => {
    setFormData(prev => {
      const updated = prev.components.filter((_, i) => i !== index);
      const newName = isNameManuallyEdited ? prev.name : buildAutoName(updated, catalogFoods);
      return { ...prev, components: updated, name: newName };
    });
  };

  // Computed price for display in form
  const computedPrice = calcTotalPrice(formData.components, catalogFoods);

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
    if (!formData.name.trim()) {
      alert('Please provide a name for the combination.');
      return;
    }

    const payload = {
      ...formData,
      components: formData.components.map(c => {
        const item = { ...c };
        if (item.customPrice === '' || item.customPrice === undefined || item.customPrice === null) {
          delete item.customPrice;
        }
        return item;
      }),
    };

    try {
      if (currentCombo) {
        await api.put(`/combinations/${currentCombo._id}`, payload);
      } else {
        await api.post('/combinations', payload);
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

  // ── Price computation helper for a saved combo card ──
  const getComboPrice = (combo) => {
    if (combo.price != null) return Number(combo.price);
    return combo.components.reduce((sum, comp) => {
      const unitPrice = comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || 0);
      return sum + unitPrice * (comp.defaultQuantity || 1);
    }, 0);
  };

  return (
    <AdminDashboardLayout>
      <div className="admin-combos-container">
        <div className="combos-header">
          <div>
            <h2>Combination Meals (Combo Builder)</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              Create set meals (e.g. Ugali &amp; Beef) by combining existing single food items from the catalogue.
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
        ) : combinations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
            <Layers size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p style={{ fontSize: '18px', fontWeight: '600' }}>No combinations yet</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>Click "Build Combo Meal" to create your first combination.</p>
          </div>
        ) : (
          <div className="combos-grid">
            {combinations.map((combo) => {
              const comboPrice = getComboPrice(combo);
              return (
                <div key={combo._id} className="combo-card">
                  <img
                    src={combo.image || 'https://via.placeholder.com/320x180?text=Combination+Meal'}
                    alt={combo.name}
                    className="combo-card-image"
                  />
                  <div className="combo-card-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={18} style={{ color: '#f97316' }} />
                      <span className="combo-badge">Combo Meal</span>
                    </div>
                    <div className="combo-card-title" style={{ marginTop: '4px' }}>
                      <h3>{combo.name}</h3>
                      {combo.description && (
                        <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>{combo.description}</p>
                      )}
                    </div>

                    {/* Price display */}
                    <div className="combo-price-row">
                      <Tag size={14} />
                      <span className="combo-price-value">
                        KES {comboPrice.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="combo-price-label">(calculated from components)</span>
                    </div>

                    <div className="combo-components-list">
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#4b5563', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '4px' }}>
                        Combo Components:
                      </span>
                      {combo.components.map((comp, idx) => {
                        const compPrice = comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || 0);
                        return (
                          <div key={idx} className="combo-component-item">
                            <span>• {comp.foodId?.name || 'Unknown Food'} ×{comp.defaultQuantity}</span>
                            <span style={{ color: '#f97316', fontWeight: '600' }}>
                              KES {(compPrice * (comp.defaultQuantity || 1)).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
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
              );
            })}
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

                  {/* ── Components section first so name auto-populates ── */}
                  <div className="components-section" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0, marginBottom: '16px' }}>
                    <h4>Step 1: Add Food Components</h4>
                    {formData.components.map((comp, index) => (
                      <div key={index} className="component-builder-row">
                        <select
                          value={comp.foodId}
                          onChange={(e) => handleComponentChange(index, 'foodId', e.target.value)}
                        >
                          <option value="">-- Select Food Item --</option>
                          {catalogFoods.map(food => (
                            <option key={food._id} value={food._id}>
                              {food.name} {food.price ? `(KES ${food.price})` : ''}
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
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>Custom Price</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Override KES"
                            value={comp.customPrice || ''}
                            onChange={(e) => handleComponentChange(index, 'customPrice', e.target.value)}
                            style={{ width: '80px' }}
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

                    {/* Live price preview */}
                    {formData.components.some(c => c.foodId) && (
                      <div className="combo-price-preview">
                        <Tag size={14} />
                        <span>Calculated Total Price:</span>
                        <strong>KES {computedPrice.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</strong>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>(sum of component prices × quantities)</span>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>Step 2: Combo Details</h4>

                    <div className="form-group">
                      <label>
                        Meal Combination Name *
                        {!isNameManuallyEdited && formData.name && (
                          <span style={{ marginLeft: '8px', fontSize: '11px', color: '#f97316', fontWeight: '600' }}>
                            ✨ Auto-generated
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Select foods above to auto-generate, or type a custom name"
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
