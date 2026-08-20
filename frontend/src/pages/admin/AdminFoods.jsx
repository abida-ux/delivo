import { useState, useEffect } from 'react';
import { Trash2, Edit, Search, Plus, Star, Store, Layers, Utensils, Sliders, CheckCircle2, Save, RefreshCw } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import api, { getAllFoods, deleteFood, updateFood, createFood, getAllRestaurants } from '../../services/api';
import AdminEditFoodModal from './AdminEditFoodModal';
import AdminCreateFoodModal from './AdminCreateFoodModal';
import { resolveImageUrl } from '../../utils/placeholderImage';
import { formatCurrency } from '../../utils/currency';
import '../pages.css';
import './AdminFoods.css';

const AdminFoods = () => {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFood, setEditingFood] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Dedicated Portions Tab state
  const [activeTab, setActiveTab] = useState('foods'); // 'foods' | 'portions'
  const [selectedFoodIdForPortions, setSelectedFoodIdForPortions] = useState('');
  const [managerPortions, setManagerPortions] = useState([]);
  const [managerPortionName, setManagerPortionName] = useState('');
  const [managerPortionPrice, setManagerPortionPrice] = useState('');
  const [savingPortions, setSavingPortions] = useState(false);
  const [portionSuccessMsg, setPortionSuccessMsg] = useState('');

  useEffect(() => {
    fetchFoods();
    fetchRestaurants();
  }, []);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const [foodsData, combosRes] = await Promise.all([
        getAllFoods(),
        api.get('/combinations').then((r) => r.data).catch(() => ({ combinations: [] })),
      ]);

      const regularFoods = Array.isArray(foodsData) ? foodsData : foodsData?.data || [];
      const rawCombos = combosRes?.combinations || (Array.isArray(combosRes) ? combosRes : []);

      const combosAsFood = rawCombos.map((combo) => {
        let comboPrice = combo.pricing?.finalPrice ?? combo.finalPrice ?? combo.price ?? 0;
        if (!comboPrice) {
          comboPrice = (combo.components || []).reduce((sum, comp) => {
            const unitPrice = comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || 0);
            return sum + unitPrice * (comp.defaultQuantity || 1);
          }, 0);
        }
        return {
          ...combo,
          price: comboPrice,
          isCombination: true,
          category: 'Combo Meal',
        };
      });

      const merged = [...regularFoods, ...combosAsFood];
      setFoods(merged);
      setFilteredFoods(merged);
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const res = await getAllRestaurants();
      const data = Array.isArray(res) ? res : res.data || [];
      setRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  // Sync selected food for portions manager tab
  useEffect(() => {
    const regularFoods = foods.filter(f => !f.isCombination);
    if (activeTab === 'portions' && regularFoods.length > 0 && !selectedFoodIdForPortions) {
      setSelectedFoodIdForPortions(regularFoods[0]._id);
    }
  }, [activeTab, foods, selectedFoodIdForPortions]);

  useEffect(() => {
    if (selectedFoodIdForPortions) {
      const current = foods.find(f => String(f._id) === String(selectedFoodIdForPortions));
      if (current) {
        const raw = Array.isArray(current.portions) && current.portions.length > 0
          ? current.portions
          : (Array.isArray(current.variations) ? current.variations : []);
        setManagerPortions(
          raw.map(p => typeof p === 'string' ? { name: p, price: Number(current.price || 0) } : { name: p.name || 'Portion', price: Number(p.price || 0) })
        );
        setPortionSuccessMsg('');
      }
    }
  }, [selectedFoodIdForPortions, foods]);

  const getRestaurantNames = (food) => {
    const names = [];
    const addName = (value) => {
      if (!value) return;
      if (typeof value === 'object') {
        if (value.name) names.push(value.name);
        return;
      }
      const matched = restaurants.find((r) => String(r._id) === String(value));
      if (matched?.name) {
        names.push(matched.name);
      } else if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
        names.push('Delivo Partner');
      } else {
        names.push(String(value));
      }
    };

    if (Array.isArray(food.restaurants) && food.restaurants.length > 0) {
      food.restaurants.forEach(addName);
    } else if (food.restaurant) {
      addName(food.restaurant);
    }

    const filtered = names.filter(Boolean);
    return filtered.length > 0 ? filtered : ['Delivo Partner'];
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const filtered = foods.filter((food) => {
      const restaurantNames = getRestaurantNames(food).join(' ').toLowerCase();
      return (
        food.name?.toLowerCase().includes(value.toLowerCase()) ||
        food.category?.toLowerCase().includes(value.toLowerCase()) ||
        restaurantNames.includes(value.toLowerCase())
      );
    });
    setFilteredFoods(filtered);
  };

  const handleEdit = (food) => {
    setEditingFood(food);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      const res = await updateFood(editingFood._id, updatedData);
      const updatedItem = res?.data || res;
      if (updatedItem && updatedItem._id) {
        setFoods(prev => prev.map(f => String(f._id) === String(updatedItem._id) ? { ...f, ...updatedItem } : f));
        setFilteredFoods(prev => prev.map(f => String(f._id) === String(updatedItem._id) ? { ...f, ...updatedItem } : f));
      }
      setIsEditModalOpen(false);
      setEditingFood(null);
      await fetchFoods();
      alert('Food item updated successfully!');
      return true;
    } catch (error) {
      console.error('Error updating food:', error);
      alert(`Failed to update food: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  const handleCreateFood = async (newFoodData) => {
    try {
      const res = await createFood(newFoodData);
      const newItem = res?.data || res;
      if (newItem && newItem._id) {
        setFoods(prev => [newItem, ...prev]);
        setFilteredFoods(prev => [newItem, ...prev]);
      }
      setIsCreateModalOpen(false);
      await fetchFoods();
      alert('Food item created successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error creating food:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to create food: ${errorMsg}`);
      return false;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this food item?')) {
      try {
        await deleteFood(id);
        setFoods(foods.filter((f) => f._id !== id));
        setFilteredFoods(filteredFoods.filter((f) => f._id !== id));
        alert('Food item deleted successfully');
      } catch (error) {
        console.error('Error deleting food:', error);
        alert('Failed to delete food item');
      }
    }
  };

  // Dedicated Portion Manager Handlers
  const handleAddPortionInManager = () => {
    if (!managerPortionName.trim()) {
      alert('Please enter portion name (e.g. Half, Full, Small, Large)');
      return;
    }
    if (!managerPortionPrice || isNaN(managerPortionPrice)) {
      alert('Please enter a valid price for the portion');
      return;
    }
    setManagerPortions(prev => [...prev, { name: managerPortionName.trim(), price: parseFloat(managerPortionPrice) }]);
    setManagerPortionName('');
    setManagerPortionPrice('');
  };

  const handleRemovePortionInManager = (idx) => {
    setManagerPortions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdatePortionPriceInManager = (idx, newPrice) => {
    setManagerPortions(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], price: parseFloat(newPrice) || 0 };
      return copy;
    });
  };

  const handleSavePortionsFromManager = async () => {
    if (!selectedFoodIdForPortions) return;
    const currentFood = foods.find(f => String(f._id) === String(selectedFoodIdForPortions));
    if (!currentFood) return;

    setSavingPortions(true);
    setPortionSuccessMsg('');
    try {
      let finalPortions = [...managerPortions];
      if (managerPortionName.trim()) {
        const pPrice = parseFloat(managerPortionPrice) || Number(currentFood.price || 0);
        if (!finalPortions.some(p => p.name.toLowerCase() === managerPortionName.trim().toLowerCase())) {
          finalPortions.push({ name: managerPortionName.trim(), price: pPrice });
        }
      }

      const updatePayload = {
        ...currentFood,
        price: currentFood.price || 0,
        portions: finalPortions,
        variations: finalPortions,
      };

      const res = await updateFood(currentFood._id, updatePayload);
      const updatedItem = res?.data || res;
      if (updatedItem && updatedItem._id) {
        setFoods(prev => prev.map(f => String(f._id) === String(updatedItem._id) ? { ...f, ...updatedItem } : f));
        setFilteredFoods(prev => prev.map(f => String(f._id) === String(updatedItem._id) ? { ...f, ...updatedItem } : f));
      }
      setManagerPortionName('');
      setManagerPortionPrice('');
      setPortionSuccessMsg(`Portions for "${currentFood.name}" saved successfully to MongoDB!`);
    } catch (err) {
      alert(`Failed to save portions: ${err.message}`);
    } finally {
      setSavingPortions(false);
    }
  };

  const selectedFoodForManager = foods.find(f => String(f._id) === String(selectedFoodIdForPortions));
  const regularFoods = foods.filter(f => !f.isCombination);

  return (
    <AdminDashboardLayout pageTitle="Foods & Portions Management">
      <div className="admin-foods">
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('foods')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'foods' ? '#16a34a' : '#f1f5f9',
              color: activeTab === 'foods' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease',
            }}
          >
            <Utensils size={16} />
            <span>All Foods ({foods.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('portions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'portions' ? '#16a34a' : '#f1f5f9',
              color: activeTab === 'portions' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease',
            }}
          >
            <Sliders size={16} />
            <span>Portions & Sizes Manager</span>
          </button>
        </div>

        {/* TAB 1: ALL FOODS GRID */}
        {activeTab === 'foods' && (
          <>
            {/* Top Header & Search Controls */}
            <div className="foods-header">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search foods by name, category or restaurant..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <button className="add-btn" onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={18} />
                <span>Add Food</span>
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading foods...</p>
              </div>
            ) : (
              <>
                <div className="results-count-bar">
                  <span className="results-count-pill">
                    <Utensils size={13} />
                    <strong>{filteredFoods.length}</strong> {filteredFoods.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="foods-grid">
                  {filteredFoods.length > 0 ? (
                    filteredFoods.map((food) => (
                      <div key={food._id} className={`food-item-card${food.isCombination ? ' food-item-card--combo' : ''}`}>
                        <div
                          className="admin-food-image"
                          style={{
                            backgroundImage: `url(${resolveImageUrl(food.image)})`,
                          }}
                        >
                          {food.isCombination ? (
                            <span className="food-combo-badge">
                              <Layers size={11} /> Combo
                            </span>
                          ) : (
                            <span className="food-rating">
                              <Star size={12} fill="#f59e0b" color="#f59e0b" />
                              {food.rating > 0 ? food.rating : 'Unrated'}
                            </span>
                          )}
                        </div>

                        <div className="food-details">
                          <div className="food-header-block">
                            <h3>{food.name}</h3>
                            <p className="category">{food.category || 'General'}</p>
                          </div>

                          {!food.isCombination && (
                            <div className="restaurant-meta-chip">
                              <Store size={12} />
                              <span>{getRestaurantNames(food).join(', ')}</span>
                            </div>
                          )}

                          {food.isCombination && food.components?.length > 0 && (
                            <div className="restaurant-meta-chip combo-components">
                              <span>{food.components.map((c) => c.foodId?.name || 'Item').join(' + ')}</span>
                            </div>
                          )}

                          <div className="food-price-tag">
                            {formatCurrency(food.price || 0)}
                          </div>

                          {/* Portions badge indicator on card */}
                          {Array.isArray(food.portions) && food.portions.length > 0 && (
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', background: '#dcfce7', padding: '4px 8px', borderRadius: '6px', marginTop: '6px', display: 'inline-block' }}>
                              ✓ {food.portions.length} Portions Configured
                            </div>
                          )}

                          <div className="food-actions" style={{ marginTop: '10px' }}>
                            {!food.isCombination && (
                              <button
                                className="admin-food-action-btn edit-btn"
                                onClick={() => handleEdit(food)}
                                title="Edit food"
                              >
                                <Edit size={14} />
                                <span>Edit</span>
                              </button>
                            )}
                            <button
                              className="admin-food-action-btn delete-btn"
                              onClick={() => handleDelete(food._id)}
                              title="Delete food"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>No foods found</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* TAB 2: DEDICATED PORTIONS & SIZES MANAGER */}
        {activeTab === 'portions' && (
          <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>Portions & Sizes Manager</h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 20px 0' }}>
              Select a food item below to add, edit, or remove custom portion sizes (e.g. Pilau: Half, Full; Tea: Small, Large).
            </p>

            {/* Food Selector Dropdown */}
            <div style={{ marginBottom: '24px', maxWidth: '500px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                Choose Food Item
              </label>
              <select
                value={selectedFoodIdForPortions}
                onChange={(e) => setSelectedFoodIdForPortions(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '15px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  border: '2px solid #16a34a',
                  background: '#f0fdf4',
                  color: '#0f172a',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="">-- Select a Food Item --</option>
                {regularFoods.map(f => (
                  <option key={f._id} value={f._id}>
                    {f.name} ({f.category || 'General'}) - Base: KES {f.price || 0}
                  </option>
                ))}
              </select>
            </div>

            {selectedFoodForManager ? (
              <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '20px' }}>
                {/* Active Food Banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  <img
                    src={resolveImageUrl(selectedFoodForManager.image)}
                    alt={selectedFoodForManager.name}
                    style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{selectedFoodForManager.name}</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                      Category: <strong>{selectedFoodForManager.category || 'General'}</strong> | Base Price: <strong>KES {selectedFoodForManager.price || 0}</strong>
                    </p>
                  </div>
                </div>

                {/* Success Banner */}
                {portionSuccessMsg && (
                  <div style={{ background: '#dcfce7', border: '1.5px solid #22c55e', color: '#15803d', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <CheckCircle2 size={18} />
                    <span>{portionSuccessMsg}</span>
                  </div>
                )}

                {/* Add Portion Inputs */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#334155' }}>Add New Portion Option</h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Portion Name (e.g. Half, Full, Small, Large)"
                      value={managerPortionName}
                      onChange={(e) => setManagerPortionName(e.target.value)}
                      style={{ flex: 1, minWidth: '200px', padding: '10px 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                    <input
                      type="number"
                      placeholder="Price (KES)"
                      value={managerPortionPrice}
                      onChange={(e) => setManagerPortionPrice(e.target.value)}
                      style={{ width: '130px', padding: '10px 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddPortionInManager}
                      style={{ background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0 16px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      + Add Portion
                    </button>
                  </div>
                </div>

                {/* Configured Portions Table */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#334155' }}>Configured Portions</h4>
                  {managerPortions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {managerPortions.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontWeight: '800', color: '#0f172a', flex: 1, fontSize: '15px' }}>{p.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>KES</span>
                            <input
                              type="number"
                              value={p.price}
                              onChange={(e) => handleUpdatePortionPriceInManager(idx, e.target.value)}
                              style={{ width: '90px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '14px' }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePortionInManager(idx)}
                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13.5px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                      No portions added yet. This food currently sells at its base price of KES {selectedFoodForManager.price || 0}.
                    </p>
                  )}
                </div>

                {/* Save Portions Button */}
                <button
                  type="button"
                  onClick={handleSavePortionsFromManager}
                  disabled={savingPortions}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '800',
                    border: 'none',
                    cursor: savingPortions ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                  }}
                >
                  {savingPortions ? (
                    <>
                      <RefreshCw size={18} className="spin" />
                      <span>Saving Portions to Database...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Save Portions for {selectedFoodForManager.name}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p style={{ color: '#64748b' }}>Please select a food item above to manage its portions.</p>
            )}
          </div>
        )}

        {/* Edit Food Modal */}
        <AdminEditFoodModal
          isOpen={isEditModalOpen}
          food={editingFood}
          restaurants={restaurants}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingFood(null);
          }}
          onSave={handleSaveEdit}
        />

        {/* Create Food Modal */}
        <AdminCreateFoodModal
          isOpen={isCreateModalOpen}
          restaurants={restaurants}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateFood}
        />
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminFoods;
