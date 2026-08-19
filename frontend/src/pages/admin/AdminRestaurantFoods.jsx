import { useState, useEffect } from 'react';
import { Loader, Store, Plus, Trash, Check, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  const [customFoodPrices, setCustomFoodPrices] = useState({});
  const [customComboPrices, setCustomComboPrices] = useState({});

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
        api.get('/foods?limit=200'),
        api.get('/combinations'),
      ]);

      const fetchedFoods = foodsRes.data.data || [];
      const fetchedCombos = combosRes.data.data || [];
      const allGlobalFoods = allFoodsRes.data.data || [];
      const allGlobalCombos = allCombosRes.data.data || [];

      // Ensure basePrice is attached from global food/combo catalogue if missing
      const foodsWithBase = fetchedFoods.map((rf) => {
        const matchingGlobal = allGlobalFoods.find((gf) => gf._id === rf._id);
        const basePrice = rf.basePrice != null ? rf.basePrice : (matchingGlobal?.price || rf.price || 0);
        return {
          ...rf,
          basePrice,
        };
      });

      const combosWithBase = fetchedCombos.map((rc) => {
        const matchingGlobal = allGlobalCombos.find((gc) => gc._id === rc._id);
        let basePrice = rc.basePrice;
        if (basePrice == null && matchingGlobal) {
          basePrice = matchingGlobal.price || (matchingGlobal.components || []).reduce((sum, comp) => {
            const unitPrice = comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || 0);
            return sum + unitPrice * (comp.defaultQuantity || 1);
          }, 0);
        }
        return {
          ...rc,
          basePrice: basePrice != null ? basePrice : (rc.price || 0),
        };
      });

      setRestaurantFoods(foodsWithBase);
      setRestaurantCombinations(combosWithBase);
      setGlobalFoods(allGlobalFoods);
      setGlobalCombinations(allGlobalCombos);
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

  // Reset a single food's selling price to its catalogue base price
  const handleResetFoodToBase = (foodId) => {
    const updated = restaurantFoods.map(item => {
      if (item._id === foodId) {
        return { ...item, price: item.basePrice || 0 };
      }
      return item;
    });
    setRestaurantFoods(updated);
  };

  // Reset a single combination's selling price to its base price
  const handleResetComboToBase = (comboId) => {
    const updated = restaurantCombinations.map(item => {
      if (item._id === comboId) {
        return { ...item, price: item.basePrice || 0 };
      }
      return item;
    });
    setRestaurantCombinations(updated);
  };

  // Reset all foods for this restaurant to their catalogue base prices
  const handleResetAllFoodsToBase = () => {
    if (!window.confirm('Reset ALL food selling prices to their official catalogue Base Prices?')) return;
    const updated = restaurantFoods.map(item => ({ ...item, price: item.basePrice || item.price || 0 }));
    setRestaurantFoods(updated);
  };

  // Reset all combinations for this restaurant to their base prices
  const handleResetAllCombosToBase = () => {
    if (!window.confirm('Reset ALL combination selling prices to their official Base Prices?')) return;
    const updated = restaurantCombinations.map(item => ({ ...item, price: item.basePrice || item.price || 0 }));
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

  // Helper to calculate combo base price
  const getComboBasePrice = (combo) => {
    if (combo.price != null && combo.price > 0) return combo.price;
    return (combo.components || []).reduce((sum, comp) => {
      const unitPrice = comp.customPrice != null ? comp.customPrice : (comp.foodId?.price || 0);
      return sum + unitPrice * (comp.defaultQuantity || 1);
    }, 0);
  };

  // Assignments modals linking submissions (using individual base prices by default)
  const handleAssignFoods = async () => {
    if (selectedCatalogueFoods.length === 0) return;
    try {
      setLinkingLoading(true);
      await Promise.all(selectedCatalogueFoods.map(async (foodId) => {
        const foodItem = globalFoods.find(f => f._id === foodId);
        const assignedPrice = customFoodPrices[foodId] !== undefined && customFoodPrices[foodId] !== ''
          ? parseFloat(customFoodPrices[foodId])
          : (foodItem?.price || 0);

        await api.post('/foods/assign', {
          restaurantId: selectedRestaurantId,
          foodId,
          price: assignedPrice,
          prepTime: 15,
        });
      }));
      setIsFoodModalOpen(false);
      setSelectedCatalogueFoods([]);
      setCustomFoodPrices({});
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
        const comboItem = globalCombinations.find(c => c._id === combinationId);
        const basePrice = comboItem ? getComboBasePrice(comboItem) : 0;
        const assignedPrice = customComboPrices[combinationId] !== undefined && customComboPrices[combinationId] !== ''
          ? parseFloat(customComboPrices[combinationId])
          : basePrice;

        await api.post('/combinations/assign', {
          restaurantId: selectedRestaurantId,
          combinationId,
          price: assignedPrice,
        });
      }));
      setIsComboModalOpen(false);
      setSelectedCatalogueCombos([]);
      setCustomComboPrices({});
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
          Assign foods and combination meals from the catalogue to restaurants. Each item retains its official <strong>Base Price</strong> by default, ensuring no random prices are displayed.
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
            <Loader className="animate-spin" size={48} style={{ color: '#16a34a' }} />
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
                <div>
                  <h3>Single Foods Linked ({restaurantFoods.length})</h3>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    Selling prices default to catalogue base price.
                  </span>
                </div>
                <div className="menu-actions-row">
                  {restaurantFoods.length > 0 && (
                    <button
                      type="button"
                      className="reset-all-base-btn"
                      onClick={handleResetAllFoodsToBase}
                      title="Reset all foods to their catalogue base prices"
                    >
                      <RefreshCw size={14} /> Reset All to Base Price
                    </button>
                  )}
                  <button className="add-catalogue-btn" onClick={() => { setSelectedCatalogueFoods([]); setCustomFoodPrices({}); setIsFoodModalOpen(true); }}>
                    <Plus size={16} /> Link Food From Catalogue
                  </button>
                </div>
              </div>

              {restaurantFoods.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                  No single foods linked to this restaurant yet. Click &quot;Link Food From Catalogue&quot; to assign dishes.
                </div>
              ) : (
                <table className="menu-table">
                  <thead>
                    <tr>
                      <th>Food Name</th>
                      <th>Base Price (Catalogue)</th>
                      <th>Restaurant Selling Price</th>
                      <th>Price Status</th>
                      <th>Discount Price</th>
                      <th>Prep Time (Min)</th>
                      <th>Availability</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurantFoods.map(item => {
                      const basePrice = item.basePrice || 0;
                      const isCustom = Number(item.price) !== Number(basePrice);

                      return (
                        <tr key={item._id}>
                          <td style={{ fontWeight: '600' }}>
                            <div>{item.name}</div>
                            {item.category && <span className="item-sub-cat">{item.category}</span>}
                          </td>
                          <td>
                            <span className="base-price-tag">KES {basePrice.toLocaleString()}</span>
                          </td>
                          <td>
                            <div className="price-input-group">
                              <span className="currency-prefix">KES</span>
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => handleFoodFieldChange(item._id, 'price', e.target.value)}
                                style={{ width: '90px' }}
                              />
                            </div>
                          </td>
                          <td>
                            {isCustom ? (
                              <div className="price-status-wrap">
                                <span className="status-pill custom">Custom (+/-)</span>
                                <button
                                  type="button"
                                  className="reset-pill-btn"
                                  onClick={() => handleResetFoodToBase(item._id)}
                                  title={`Reset to catalogue base price (KES ${basePrice})`}
                                >
                                  <RefreshCw size={12} /> Reset to Base
                                </button>
                              </div>
                            ) : (
                              <span className="status-pill matches">
                                <CheckCircle2 size={13} /> Base Price
                              </span>
                            )}
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
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                              title="Unlink from restaurant"
                            >
                              <Trash size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* ====== COMBINATION MEALS SECTION ====== */}
            <div className="menu-section-card">
              <div className="menu-section-header">
                <div>
                  <h3>Combination Meals Linked ({restaurantCombinations.length})</h3>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    Combo prices default to component base price total.
                  </span>
                </div>
                <div className="menu-actions-row">
                  {restaurantCombinations.length > 0 && (
                    <button
                      type="button"
                      className="reset-all-base-btn"
                      onClick={handleResetAllCombosToBase}
                      title="Reset all combos to their base prices"
                    >
                      <RefreshCw size={14} /> Reset All to Base Price
                    </button>
                  )}
                  <button className="add-catalogue-btn" onClick={() => { setSelectedCatalogueCombos([]); setCustomComboPrices({}); setIsComboModalOpen(true); }}>
                    <Plus size={16} /> Link Combo Meal
                  </button>
                </div>
              </div>

              {restaurantCombinations.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                  No combination meals linked to this restaurant yet. Click &quot;Link Combo Meal&quot; to assign combinations.
                </div>
              ) : (
                <table className="menu-table">
                  <thead>
                    <tr>
                      <th>Combination Name</th>
                      <th>Base Price (Catalogue)</th>
                      <th>Restaurant Selling Price</th>
                      <th>Price Status</th>
                      <th>Discount Price</th>
                      <th>Availability</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurantCombinations.map(item => {
                      const basePrice = item.basePrice || 0;
                      const isCustom = Number(item.price) !== Number(basePrice);

                      return (
                        <tr key={item._id}>
                          <td style={{ fontWeight: '600' }}>{item.name}</td>
                          <td>
                            <span className="base-price-tag">KES {basePrice.toLocaleString()}</span>
                          </td>
                          <td>
                            <div className="price-input-group">
                              <span className="currency-prefix">KES</span>
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => handleComboFieldChange(item._id, 'price', e.target.value)}
                                style={{ width: '90px' }}
                              />
                            </div>
                          </td>
                          <td>
                            {isCustom ? (
                              <div className="price-status-wrap">
                                <span className="status-pill custom">Custom (+/-)</span>
                                <button
                                  type="button"
                                  className="reset-pill-btn"
                                  onClick={() => handleResetComboToBase(item._id)}
                                  title={`Reset to base price (KES ${basePrice})`}
                                >
                                  <RefreshCw size={12} /> Reset to Base
                                </button>
                              </div>
                            ) : (
                              <span className="status-pill matches">
                                <CheckCircle2 size={13} /> Base Price
                              </span>
                            )}
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
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                              title="Unlink combo"
                            >
                              <Trash size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
            <div className="category-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
              <div className="modal-header">
                <div>
                  <h3>Link Foods From Catalogue</h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>
                    Select items to link. Each item will use its individual <strong>Base Price</strong> by default.
                  </p>
                </div>
                <button className="close-modal-btn" onClick={() => setIsFoodModalOpen(false)}>Close</button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                    Available Catalogue Items ({unassignedFoods.length}):
                  </label>
                  {unassignedFoods.length > 0 && (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      onClick={() => {
                        if (selectedCatalogueFoods.length === unassignedFoods.length) {
                          setSelectedCatalogueFoods([]);
                        } else {
                          setSelectedCatalogueFoods(unassignedFoods.map(f => f._id));
                        }
                      }}
                    >
                      {selectedCatalogueFoods.length === unassignedFoods.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>

                {unassignedFoods.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                    All global catalogue foods are already linked to this restaurant!
                  </div>
                ) : (
                  <div className="assign-modal-list">
                    {unassignedFoods.map(food => {
                      const isSelected = selectedCatalogueFoods.includes(food._id);
                      return (
                        <div
                          key={food._id}
                          className={`assign-modal-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedCatalogueFoods(isSelected
                              ? selectedCatalogueFoods.filter(id => id !== food._id)
                              : [...selectedCatalogueFoods, food._id]
                            );
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                            />
                            <div>
                              <span style={{ fontWeight: '600', color: '#111827' }}>{food.name}</span>
                              {food.category && (
                                <span style={{ marginLeft: '8px', fontSize: '11px', color: '#6b7280', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                                  {food.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="base-price-chip">
                              Base: KES {Number(food.price || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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
                    {linkingLoading ? 'Linking...' : `Link Selected (${selectedCatalogueFoods.length}) at Base Price`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== DIALOG: ASSIGN MEAL COMBINATIONS ====== */}
        {isComboModalOpen && (
          <div className="category-modal-overlay" onClick={() => setIsComboModalOpen(false)}>
            <div className="category-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
              <div className="modal-header">
                <div>
                  <h3>Link Meal Combinations</h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>
                    Select combos to link. Each combo uses its computed <strong>Base Price</strong>.
                  </p>
                </div>
                <button className="close-modal-btn" onClick={() => setIsComboModalOpen(false)}>Close</button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                    Available Combinations ({unassignedCombos.length}):
                  </label>
                  {unassignedCombos.length > 0 && (
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      onClick={() => {
                        if (selectedCatalogueCombos.length === unassignedCombos.length) {
                          setSelectedCatalogueCombos([]);
                        } else {
                          setSelectedCatalogueCombos(unassignedCombos.map(c => c._id));
                        }
                      }}
                    >
                      {selectedCatalogueCombos.length === unassignedCombos.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>

                {unassignedCombos.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                    All global combinations are already linked to this restaurant!
                  </div>
                ) : (
                  <div className="assign-modal-list">
                    {unassignedCombos.map(combo => {
                      const isSelected = selectedCatalogueCombos.includes(combo._id);
                      const basePrice = getComboBasePrice(combo);
                      return (
                        <div
                          key={combo._id}
                          className={`assign-modal-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedCatalogueCombos(isSelected
                              ? selectedCatalogueCombos.filter(id => id !== combo._id)
                              : [...selectedCatalogueCombos, combo._id]
                            );
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                            />
                            <span style={{ fontWeight: '600', color: '#111827' }}>{combo.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="base-price-chip">
                              Base: KES {basePrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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
                    {linkingLoading ? 'Linking...' : `Link Selected (${selectedCatalogueCombos.length}) at Base Price`}
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
