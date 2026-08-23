import { useState, useEffect } from 'react';
import { Trash2, Edit, Search, Plus, Star, Clock, Store, User, Phone } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getAllRestaurants, getAllUsers, deleteRestaurant, updateRestaurant, createRestaurant } from '../../services/api';
import AdminEditRestaurantModal from './AdminEditRestaurantModal';
import AdminCreateRestaurantModal from './AdminCreateRestaurantModal';
import { resolveImageUrl } from '../../utils/placeholderImage';
import '../pages.css';
import './Restaurants.css';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchRestaurantsAndUsers();
  }, []);

  const fetchRestaurantsAndUsers = async () => {
    try {
      setLoading(true);
      const [res, usersData] = await Promise.all([
        getAllRestaurants(),
        getAllUsers(),
      ]);
      const data = Array.isArray(res) ? res : res.data || [];
      setRestaurants(data);
      setFilteredRestaurants(data);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching restaurants and users:', error);
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
      await fetchRestaurantsAndUsers();
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
      await createRestaurant(newRestaurantData);
      setIsCreateModalOpen(false);
      await fetchRestaurantsAndUsers();
      alert('Restaurant created successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating restaurant:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to create restaurant: ${errorMsg}`);
      return false;
    }
  };

  const formatDeliveryTime = (time) => {
    if (!time) return '30 mins';
    const clean = String(time).replace(/\s*mins?/gi, '').trim();
    return `${clean || '30'} mins`;
  };

  return (
    <AdminDashboardLayout pageTitle="Restaurants Management">
      <div className="admin-restaurants">
        {/* Top Header & Search */}
        <div className="restaurants-header">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search restaurants by name or cuisine..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} />
            <span>Add Restaurant</span>
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading restaurants...</p>
          </div>
        ) : (
          <>
            <div className="results-count-bar">
              <span className="results-count-pill">
                <Store size={13} />
                <strong>{filteredRestaurants.length}</strong> {filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'}
              </span>
            </div>

            <div className="restaurants-grid">
              {filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((restaurant) => {
                  const ownerObj = typeof restaurant.ownerId === 'object' && restaurant.ownerId
                    ? restaurant.ownerId
                    : users.find((u) => u._id === restaurant.ownerId);
                  const ownerName = ownerObj?.name || (restaurant.ownerId ? 'Assigned Owner' : 'Unassigned');
                  const ownerPhone = ownerObj?.phone || restaurant.phone || 'No phone provided';

                  return (
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
                        <div className="restaurant-header-block">
                          <h3>{restaurant.name}</h3>
                          <p className="cuisine">{restaurant.cuisine || 'Fast Food'}</p>
                        </div>

                        <div className="restaurant-meta">
                          <div className="rating">
                            <Star size={13} fill="#f59e0b" color="#f59e0b" />
                            <span>{restaurant.rating || 4.5}</span>
                          </div>
                          <div className="delivery-time">
                            <Clock size={13} />
                            <span>{formatDeliveryTime(restaurant.deliveryTime)}</span>
                          </div>
                        </div>

                        {/* Owner Details Section */}
                        <div className="restaurant-owner-block" style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: ownerObj ? '#0f172a' : '#94a3b8' }}>
                            <User size={13} color={ownerObj ? '#16a34a' : '#94a3b8'} />
                            <span>Owner: {ownerName}</span>
                          </div>
                          {ownerObj && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', marginTop: '3px' }}>
                              <Phone size={12} color="#64748b" />
                              <span>{ownerPhone}</span>
                            </div>
                          )}
                        </div>

                        <div className="card-actions" style={{ marginTop: '12px' }}>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(restaurant)}
                          >
                            <Edit size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(restaurant._id)}
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
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
          users={users}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRestaurant(null);
          }}
          onSave={handleSaveEdit}
        />

        <AdminCreateRestaurantModal
          isOpen={isCreateModalOpen}
          users={users}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateRestaurant}
        />
      </div>
    </AdminDashboardLayout>
  );
};

export default Restaurants;
