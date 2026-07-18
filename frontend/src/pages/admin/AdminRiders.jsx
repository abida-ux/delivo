import {useState, useEffect} from 'react';
import { Trash2, Edit, Search, Plus, Truck, Star } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getAllUsers, deleteUser, updateUser, registerUser } from '../../services/api';
import AdminEditRiderModal from './AdminEditRiderModal';
import AdminCreateRiderModal from './AdminCreateRiderModal';
import '../pages.css';
import './AdminRiders.css';

const AdminRiders = () => {
  const [riders, setRiders] = useState([]);
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRider, setEditingRider] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      // Filter only riders
      const ridersData = usersData.filter(u => u.role === 'rider');
      setRiders(ridersData);
      setFilteredRiders(ridersData);
    } catch (error) {
      console.error('Error fetching riders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const filtered = riders.filter(
      (rider) =>
        rider.name?.toLowerCase().includes(value.toLowerCase()) ||
        rider.email?.toLowerCase().includes(value.toLowerCase()) ||
        rider.phone?.includes(value)
    );
    setFilteredRiders(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rider?')) {
      try {
        await deleteUser(id);
        setRiders(riders.filter((r) => r._id !== id));
        setFilteredRiders(filteredRiders.filter((r) => r._id !== id));
        alert('Rider deleted successfully');
      } catch (error) {
        console.error('Error deleting rider:', error);
        alert('Failed to delete rider');
      }
    }
  };

  const handleEdit = (rider) => {
    setEditingRider(rider);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      await updateUser(editingRider._id, updatedData);
      setIsEditModalOpen(false);
      setEditingRider(null);
      await fetchRiders();
      alert('Rider updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating rider:', error);
      alert(`Failed to update rider: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  const handleCreateRider = async (newRiderData) => {
    try {
      console.log('👨‍💼 Creating rider with data:', newRiderData);
      // Register as rider
      const riderData = {
        ...newRiderData,
        role: 'rider',
      };
      await registerUser(riderData);
      setIsCreateModalOpen(false);
      await fetchRiders();
      alert('Rider created successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating rider:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to create rider: ${errorMsg}`);
      return false;
    }
  };

  return (
    <AdminDashboardLayout pageTitle="Delivery Riders">
      <div className="admin-riders">
        <div className="riders-header">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search riders by name, email or phone..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button
            className="add-btn"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={20} />
            Add Rider
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading riders...</p>
          </div>
        ) : (
          <div className="riders-table-container">
            {filteredRiders.length > 0 ? (
              <table className="riders-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Rating</th>
                    <th>Joined Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRiders.map((rider) => (
                    <tr key={rider._id}>
                      <td className="rider-name">
                        <div className="rider-avatar">
                          <Truck size={18} />
                        </div>
                        {rider.name}
                      </td>
                      <td>{rider.email}</td>
                      <td>{rider.phone || '-'}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: rider.isActive ? '#e8f5e9' : '#ffebee',
                            color: rider.isActive ? '#2e7d32' : '#c62828',
                          }}
                        >
                          {rider.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="rating-display">
                          <Star size={16} fill="#ffc107" color="#ffc107" />
                          <span>{rider.rating || '-'}</span>
                        </div>
                      </td>
                      <td>{new Date(rider.createdAt).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <button
                          className="action-btn edit-btn"
                          title="Edit"
                          onClick={() => handleEdit(rider)}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          title="Delete"
                          onClick={() => handleDelete(rider._id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <Truck size={48} />
                <p>No riders found</p>
                <button
                  className="add-btn"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus size={16} />
                  Create First Rider
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AdminEditRiderModal
        isOpen={isEditModalOpen}
        rider={editingRider}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRider(null);
        }}
        onSave={handleSaveEdit}
      />

      <AdminCreateRiderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateRider}
      />
    </AdminDashboardLayout>
  );
};

export default AdminRiders;
