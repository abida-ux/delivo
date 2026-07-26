import { useState, useEffect } from 'react';
import { Loader, Store, Plus, Trash, Check, HelpCircle, ArrowRight } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import api from '../../services/api';
import './AdminRestaurantFoods.css';

const AdminRestaurantFoods = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [restaurantFoods, setRestaurantFoods] = useState([]);
  const [restaurantCombinations, setRestaurantCombinations] = useState([]);
  const [globalFoods, setGlobalFoods] = useState([]);
  const [globalCombinations, setGlobalCombinations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [linkingLoading, setLinkingLoading] = useState(false);

  // Assignment Modal states
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [selectedCatalogueFoods, setSelectedCatalogueFoods] = useState([]);
  const [selectedCatalogueCombos, setSelectedCatalogueCombos] = useState([]);
  const [assignPrice, setAssignPrice] = useState(100);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/restaurants');
      const data = res.data.data || [];
      setRestaurants(data);
      if (data.length > 0) {
        setSelectedRestaurantId(data[0]._id);
        fetchMenu(data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const fetchMenu = async (restaurantId) => {
    if (!restaurantId) return;
    try {
      setLoading(true);
      const [foodsRes, combosRes, allFoodsRes, allCombosRes] = await Promise.all([
        api.get(`/foods/restaurant/${restaurantId}`),
        api.get(`/combinations?restaurantId=${restaurantId}`),
        api.get('/foods'),
        api.get('/combinations'),
      ]);

      setRestaurantFoods(foodsRes.data.data || []);
      setRestaurantCombinations(combosRes.data.data || []);
      setGlobalFoods(allFoodsRes.data.data || []);
      setGlobalCombinations(allCombosRes.data.data || []);
    } catch (error) {
      console.error('Error fetching restaurant menu assignment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantChange = (e) => {
    const id = e.target.value;
    setSelectedRestaurantId(id);
    fetchMenu(id);
  };

  // Inline inputs editor handler
  const handleFoodFieldChange = (foodId, field, value) => {
    const updated = restaurantFoods.map(item => {
      if (item._id === foodId) {
        return { ...item, [field]: field === 'availability' ? value : parseFloat(value) || 0 };
      }
      return item;
    });
    setRestaurantFoods(updated);
  };

  const handleComboFieldChange = (comboId, field, value) => {
    const updated = restaurantCombinations.map(item => {
      if (item._id === comboId) {
        return { ...item, [field]: field === 'availability' ? value : parseFloat(value) || 0 };
      }
      return item;
    });
    setRestaurantCombinations(updated);
  };

  // Save changes handler
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      // Save all modified food links settings
      await Promise.all(restaurantFoods.map(async (item) => {
        await api.put(`/foods/restaurant/${selectedRestaurantId}/${item._id}`, {
          price: item.price,
          discountPrice: item.discountPrice || undefined,
          availability: item.availability,
          prepTime: item.prepTime,
        });
      }));

      // Save all modified combo links settings
      await Promise.all(restaurantCombinations.map(async (item) => {
        await api.put(`/combinations/restaurant/${selectedRestaurantId}/${item._id}`, {
          price: item.price,
          discountPrice: item.discountPrice || undefined,
          availability: item.availability,
        });
      }));

      alert('All prices and settings updated successfully!');
      fetchMenu(selectedRestaurantId);
    } catch (error) {
      alert('Failed to save menu changes: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Unlink item handlers
  const handleUnlinkFood = async (foodId) => {
    if (!window.confirm('Are you sure you want to remove this food from this restaurant?')) return;
    try {
      await api.delete(`/foods/restaurant/${selectedRestaurantId}/${foodId}`);
      fetchMenu(selectedRestaurantId);
    } catch (error) {
      alert('Failed to unlink food');
    }
  };

  const handleUnlinkCombo = async (comboId) => {
    if (!window.confirm('Are you sure you want to remove this combination meal from this restaurant?')) return;
    try {
      await api.delete(`/combinations/restaurant/${selectedRestaurantId}/${comboId}`);
      fetchMenu(selectedRestaurantId);
    } catch (error) {
      alert('Failed to unlink combination');
    }
  };

  // Assignments modals linking submissions
  const handleAssignFoods = async () => {
    if (selectedCatalogueFoods.length === 0) return;
    try {
      setLinkingLoading(true);
      await Promise.all(selectedCatalogueFoods.map(async (foodId) => {
        await api.post('/foods/assign', {
          restaurantId: selectedRestaurantId,
          foodId,
          price: assignPrice,
          prepTime: 15,
        });
      }));
      setIsFoodModalOpen(false);
      setSelectedCatalogueFoods([]);
      fetchMenu(selectedRestaurantId);
    } catch (error) {
      alert('Error linking foods: ' + (error.response?.data?.message || error.message));
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleAssignCombos = async () => {
    if (selectedCatalogueCombos.length === 0) return;
    try {
      setLinkingLoading(true);
      await Promise.all(selectedCatalogueCombos.map(async (combinationId) => {
        await api.post('/combinations/assign', {
          restaurantId: selectedRestaurantId,
          combinationId,
          price: assignPrice,
        });
      }));
      setIsComboModalOpen(false);
      setSelectedCatalogueCombos([]);
      fetchMenu(selectedRestaurantId);
    } catch (error) {
      alert('Error linking combinations: ' + (error.response?.data?.message || error.message));
    } finally {
      setLinkingLoading(false);
    }
  };

  const unassignedFoods = globalFoods.filter(gf => !restaurantFoods.some(rf => rf._id === gf._id));
  const unassignedCombos = globalCombinations.filter(gc => !restaurantCombinations.some(rc => rc._id === gc._id));

  return (
    <AdminDashboardLayout>
      <div className="admin-restaurant-menu-container">
        <h2>Restaurant Pricing & Menu Assignment</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px', marginBottom: '20px' }}>
          Select a restaurant to customise selling prices, toggle availability, and assign foods from the global catalogue.
        </p>

        <div className="restaurant-selector-row">
          <Store size={22} style={{ color: '#6b7280' }} />
          <select value={selectedRestaurantId} onChange={handleRestaurantChange}>
            <option value="">-- Choose Restaurant --</option>
            {restaurants.map(rest => (
              <option key={rest._id} value={rest._id}>{rest.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader className="animate-spin" size={48} style={{ color: '#f97316' }} />
          </div>
        ) : !selectedRestaurantId ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
            Please select a restaurant to manage menu and pricing options.
          </div>
        ) : (
          <div className="menu-sections-wrapper">
            
            {/* ====== FOOD ITEMS SECTION ====== */}
            <div className="menu-section-card">
              <div className="menu-section-header">
                <h3>Single Foods Linked</h3>
                <button className="add-catalogue-btn" onClick={() => { setAssignPrice(100); setIsFoodModalOpen(true); }}>
                  <Plus size={16} /> Link Food From Catalogue
                </button>
              </div>

              {restaurantFoods.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                  No single foods linked to this restaurant yet.
                </div>
              ) : (
                <table className="menu-table">
                  <thead>
                    <tr>
                      <th>Food Name</th>
                      <th>Selling Price (KSh)</th>
                      <th>Discount Price (KSh)</th>
                      <th>Prep Time (Min)</th>
                      <th>Availability</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurantFoods.map(item => (
                      <tr key={item._id}>
                        <td style={{ fontWeight: '600' }}>{item.name}</td>
                        <td>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleFoodFieldChange(item._id, 'price', e.target.value)}
                            style={{ width: '90px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.discountPrice || ''}
                            onChange={(e) => handleFoodFieldChange(item._id, 'discountPrice', e.target.value)}
                            placeholder="None"
                            style={{ width: '90px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.prepTime}
                            onChange={(e) => handleFoodFieldChange(item._id, 'prepTime', e.target.value)}
                            style={{ width: '70px' }}
                          />
                        </td>
                        <td>
                          <select
                            value={item.availability}
                            onChange={(e) => handleFoodFieldChange(item._id, 'availability', e.target.value === 'true')}
                          >
                            <option value="true">In Stock</option>
                            <option value="false">Out of Stock</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleUnlinkFood(item._id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ====== COMBINATION MEALS SECTION ====== */}
            <div className="menu-section-card">
              <div className="menu-section-header">
                <h3>Combination Meals Linked</h3>
                <button className="add-catalogue-btn" onClick={() => { setAssignPrice(150); setIsComboModalOpen(true); }}>
                  <Plus size={16} /> Link Combo Meal
                </button>
              </div>

              {restaurantCombinations.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                  No combination meals linked to this restaurant yet.
                </div>
              ) : (
                <table className="menu-table">
                  <thead>
                    <tr>
                      <th>Combination Name</th>
                      <th>Selling Price (KSh)</th>
                      <th>Discount Price (KSh)</th>
                      <th>Availability</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurantCombinations.map(item => (
                      <tr key={item._id}>
                        <td style={{ fontWeight: '600' }}>{item.name}</td>
                        <td>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleComboFieldChange(item._id, 'price', e.target.value)}
                            style={{ width: '90px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.discountPrice || ''}
                            onChange={(e) => handleComboFieldChange(item._id, 'discountPrice', e.target.value)}
                            placeholder="None"
                            style={{ width: '90px' }}
                          />
                        </td>
                        <td>
                          <select
                            value={item.availability}
                            onChange={(e) => handleComboFieldChange(item._id, 'availability', e.target.value === 'true')}
                          >
                            <option value="true">Available</option>
                            <option value="false">Unavailable</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleUnlinkCombo(item._id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ====== SAVE BUTTON BAR ====== */}
            <div className="menu-save-row">
              <button className="menu-save-btn" onClick={handleSaveChanges}>
                <Check size={18} style={{ marginRight: '6px' }} /> Save Prices & Settings
              </button>
            </div>
          </div>
        )}

        {/* ====== DIALOG: ASSIGN CATALOGUE FOODS ====== */}
        {isFoodModalOpen && (
          <div className="category-modal-overlay" onClick={() => setIsFoodModalOpen(false)}>
            <div className="category-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Link Foods From Catalogue</h3>
                <button className="close-modal-btn" onClick={() => setIsFoodModalOpen(false)}>Close</button>
              </div>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Base Price for Linked Items (KSh) *</label>
                  <input
                    type="number"
                    value={assignPrice}
                    onChange={e => setAssignPrice(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Select foods to assign:
                </label>
                {unassignedFoods.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                    All global catalogue foods are already linked to this restaurant!
                  </div>
                ) : (
                  <div className="assign-modal-list">
                    {unassignedFoods.map(food => (
                      <div
                        key={food._id}
                        className="assign-modal-item"
                        onClick={() => {
                          const isSelected = selectedCatalogueFoods.includes(food._id);
                          setSelectedCatalogueFoods(isSelected
                            ? selectedCatalogueFoods.filter(id => id !== food._id)
                            : [...selectedCatalogueFoods, food._id]
                          );
                        }}
                      >
                        <span>{food.name}</span>
                        <input
                          type="checkbox"
                          checked={selectedCatalogueFoods.includes(food._id)}
                          onChange={() => {}}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="modal-actions" style={{ marginTop: '18px' }}>
                  <button type="button" className="cancel-modal-btn" onClick={() => setIsFoodModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="submit-modal-btn"
                    onClick={handleAssignFoods}
                    disabled={selectedCatalogueFoods.length === 0 || linkingLoading}
                  >
                    {linkingLoading ? 'Linking...' : `Link Selected (${selectedCatalogueFoods.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== DIALOG: ASSIGN MEAL COMBINATIONS ====== */}
        {isComboModalOpen && (
          <div className="category-modal-overlay" onClick={() => setIsComboModalOpen(false)}>
            <div className="category-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Link Meal Combinations</h3>
                <button className="close-modal-btn" onClick={() => setIsComboModalOpen(false)}>Close</button>
              </div>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Combo Base Price for Linked Restaurant (KSh) *</label>
                  <input
                    type="number"
                    value={assignPrice}
                    onChange={e => setAssignPrice(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Select combinations to assign:
                </label>
                {unassignedCombos.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                    All global combinations are already linked to this restaurant!
                  </div>
                ) : (
                  <div className="assign-modal-list">
                    {unassignedCombos.map(combo => (
                      <div
                        key={combo._id}
                        className="assign-modal-item"
                        onClick={() => {
                          const isSelected = selectedCatalogueCombos.includes(combo._id);
                          setSelectedCatalogueCombos(isSelected
                            ? selectedCatalogueCombos.filter(id => id !== combo._id)
                            : [...selectedCatalogueCombos, combo._id]
                          );
                        }}
                      >
                        <span>{combo.name}</span>
                        <input
                          type="checkbox"
                          checked={selectedCatalogueCombos.includes(combo._id)}
                          onChange={() => {}}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="modal-actions" style={{ marginTop: '18px' }}>
                  <button type="button" className="cancel-modal-btn" onClick={() => setIsComboModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="submit-modal-btn"
                    onClick={handleAssignCombos}
                    disabled={selectedCatalogueCombos.length === 0 || linkingLoading}
                  >
                    {linkingLoading ? 'Linking...' : `Link Selected (${selectedCatalogueCombos.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminRestaurantFoods;
