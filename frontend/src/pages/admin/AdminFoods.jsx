import {useState, useEffect} from 'react';
import { Trash2, Edit, Search, Plus, Star, Store } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import AdminEditFoodModal from './AdminEditFoodModal';
import AdminCreateFoodModal from './AdminCreateFoodModal';
import { getAllFoods, deleteFood, updateFood, createFood, getAllRestaurants } from '../../services/api';
import { resolveImageUrl } from '../../utils/placeholderImage';
import { formatCurrency } from '../../utils/currency';
import '../pages.css';
import './AdminFoods.css';


const AdminFoods = () => {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFood, setEditingFood] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    fetchFoods();
    fetchRestaurants();
  }, []);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const res = await getAllFoods();
      const data = Array.isArray(res) ? res : res.data || [];
      setFoods(data);
      setFilteredFoods(data);
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
      names.push(String(value));
    };

    if (Array.isArray(food.restaurants)) {
      food.restaurants.forEach(addName);
    } else if (food.restaurant) {
      addName(food.restaurant);
    }

    return names.filter(Boolean);
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
      
      // Close modal and reset state first
      setIsEditModalOpen(false);
      setEditingFood(null);
      
      // Refetch foods to ensure data consistency
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
      console.log('🍔 Creating food with data:', newFoodData);
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
        <div className="foods-header">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search foods by name, category or restaurant..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={20} />
            Add Food
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading foods...</p>
          </div>
        ) : (
          <div className="foods-grid">
            {filteredFoods.length > 0 ? (
              filteredFoods.map((food) => (
                <div key={food._id} className="food-item-card">
                  <div
                    className="food-image"
                    style={{
                      backgroundImage: `url(${resolveImageUrl(food.image)})`,
                    }}
                  >
                    <span className="food-rating"><Star size={13} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '3px', fill: '#f59e0b', color: '#f59e0b' }} /> {food.rating || 4.5}</span>
                  </div>

                  <div className="food-details">
                    <h3>{food.name}</h3>
                    <p className="category">{food.category}</p>
                    <p className="restaurant">
                      <Store size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                      {getRestaurantNames(food).join(', ')}
                    </p>


                    <div className="food-price">{formatCurrency(food.price || 0)}</div>

                    <div className="food-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(food)}
                        title="Edit food"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(food._id)}
                        title="Delete food"
                      >
                        <Trash2 size={16} />
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
