import { useState, useEffect } from 'react';
import { Trash2, Edit, Search, Plus, Star, Store, Layers, Utensils } from 'lucide-react';
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
      await updateFood(editingFood._id, updatedData);
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
      await createFood(newFoodData);
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

  return (
    <AdminDashboardLayout pageTitle="Foods Management">
      <div className="admin-foods">
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
                      className="food-image"
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

                      <div className="food-actions">
                        {!food.isCombination && (
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(food)}
                            title="Edit food"
                          >
                            <Edit size={14} />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          className="action-btn delete-btn"
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
