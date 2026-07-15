import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Search, Plus, Star } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getAllRestaurants, deleteRestaurant, updateRestaurant, createRestaurant } from '../../services/api';
import AdminEditRestaurantModal from './AdminEditRestaurantModal';
import AdminCreateRestaurantModal from './AdminCreateRestaurantModal';
import { resolveImageUrl } from '../../utils/placeholderImage';
import '../pages.css';
import './Restaurants.css';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await getAllRestaurants();
      console.log('🍽️ Restaurants Response:', res);
      const data = Array.isArray(res) ? res : res.data || [];
      console.log('🍽️ Parsed Restaurants Data:', data);
      setRestaurants(data);
      setFilteredRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const filtered = restaurants.filter(
      (restaurant) =>
        restaurant.name?.toLowerCase().includes(value.toLowerCase()) ||
        restaurant.cuisine?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredRestaurants(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      try {
        await deleteRestaurant(id);
        setRestaurants(restaurants.filter((r) => r._id !== id));
        setFilteredRestaurants(filteredRestaurants.filter((r) => r._id !== id));
        alert('Restaurant deleted successfully');
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        alert('Failed to delete restaurant');
      }
    }
  };

  const handleEdit = (restaurant) => {
    setEditingRestaurant(restaurant);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      await updateRestaurant(editingRestaurant._id, updatedData);
      setIsEditModalOpen(false);
      setEditingRestaurant(null);
      await fetchRestaurants();
      alert('Restaurant updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating restaurant:', error);
      alert(`Failed to update restaurant: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  const handleCreateRestaurant = async (newRestaurantData) => {
    try {
      console.log('🏪 Creating restaurant with data:', newRestaurantData);
      await createRestaurant(newRestaurantData);
      setIsCreateModalOpen(false);
      await fetchRestaurants();
      alert('Restaurant created successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating restaurant:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to create restaurant: ${errorMsg}`);
      return false;
    }
  };

  return (
    <AdminDashboardLayout pageTitle="Restaurants Management">
      <div className="admin-restaurants">
        <div className="restaurants-header">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search restaurants by name or cuisine..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={20} />
            Add Restaurant
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading restaurants...</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
              Total: {restaurants.length} restaurants found
            </div>
            <div className="restaurants-grid">
              {filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((restaurant) => (
                  <div key={restaurant._id} className="restaurant-card">
                    <div
                      className="restaurant-image"
                      style={{
                        backgroundImage: `url(${resolveImageUrl(restaurant.bannerImage)})`,
                      }}
                    >
                      <div className="restaurant-status">
                        {restaurant.isOpen ? (
                          <span className="status-badge open">Open</span>
                        ) : (
                          <span className="status-badge closed">Closed</span>
                        )}
                      </div>
                    </div>

                    <div className="restaurant-info">
                      <h3>{restaurant.name}</h3>
                      <p className="cuisine">{restaurant.cuisine}</p>

                      <div className="restaurant-meta">
                        <div className="rating">
                          <Star size={16} />
                          <span>{restaurant.rating || 4.5}</span>
                        </div>
                        <div className="delivery-time">
                          📍 {restaurant.deliveryTime || 30} mins
                        </div>
                      </div>

                      <div className="card-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(restaurant)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(restaurant._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No restaurants found</p>
                </div>
              )}
            </div>
          </>
        )}

        <AdminEditRestaurantModal
          isOpen={isEditModalOpen}
          restaurant={editingRestaurant}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRestaurant(null);
          }}
          onSave={handleSaveEdit}
        />

        <AdminCreateRestaurantModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateRestaurant}
        />
      </div>
    </AdminDashboardLayout>
  );
};

export default Restaurants;
