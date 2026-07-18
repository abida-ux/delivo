import {useState, useEffect} from 'react';
import { Trash2, Edit, Search, Plus } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getAllUsers, deleteUser, updateUser, createUser } from '../../services/api';
import AdminEditUserModal from './AdminEditUserModal';
import AdminCreateUserModal from './AdminCreateUserModal';
import '../pages.css';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const filtered = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(value.toLowerCase()) ||
        user.email?.toLowerCase().includes(value.toLowerCase()) ||
        user.role?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        setUsers(users.filter((u) => u._id !== id));
        setFilteredUsers(filteredUsers.filter((u) => u._id !== id));
        alert('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      await updateUser(editingUser._id, updatedData);
      setIsEditModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
      alert('User updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Failed to update user: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  const handleCreateUser = async (newUserData) => {
    try {
      console.log('👤 Creating user with data:', newUserData);
      await createUser(newUserData);
      setIsCreateModalOpen(false);
      await fetchUsers();
      alert('User created successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to create user: ${errorMsg}`);
      return false;
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: '#ff6b35',
      restaurant: '#22c55e',
      rider: '#3b82f6',
      customer: '#8b5cf6',
    };
    return colors[role] || '#666';
  };

  return (
    <AdminDashboardLayout pageTitle="Users Management">
      <div className="admin-users">
        <div className="users-header">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search users by name, email or role..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={20} />
            Add User
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <div className="users-table-container">
            {filteredUsers.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Joined Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="user-name">
                        <div className="user-avatar">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        {user.name}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className="role-badge"
                          style={{ backgroundColor: `${getRoleColor(user.role)}20`, color: getRoleColor(user.role) }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>{user.phone || '-'}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <button
                          className="action-btn edit-btn"
                          title="Edit"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          title="Delete"
                          onClick={() => handleDelete(user._id)}
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
                <p>No users found</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AdminEditUserModal
        isOpen={isEditModalOpen}
        user={editingUser}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveEdit}
      />

      <AdminCreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateUser}
      />
    </AdminDashboardLayout>
  );
};

export default AdminUsers;
