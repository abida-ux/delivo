import { useState, useEffect } from 'react';
import { Trash2, Edit, Search, Plus, Mail, Phone, Calendar, Shield } from 'lucide-react';
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
      await createUser(newUserData);
      setIsCreateModalOpen(false);
      await fetchUsers();
      alert('User created successfully');
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to create user: ${errorMsg}`);
      return false;
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: '#0f172a',
      restaurant: '#16a34a',
      rider: '#2563eb',
      customer: '#8b5cf6',
    };
    return colors[role] || '#64748b';
  };

  return (
    <AdminDashboardLayout pageTitle="Users Management">
      <div className="admin-users">
        {/* Top Controls: Search + Add User */}
        <div className="users-header">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search users by name, email or role..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} />
            <span>Add User</span>
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p>No users found</p>
          </div>
        ) : (
          <div className="users-table-container">
            {/* Desktop Table View (visible >= 768px) */}
            <div className="users-desktop-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="user-name-cell">
                        <div
                          className="user-avatar"
                          style={{
                            backgroundColor: `${getRoleColor(user.role)}18`,
                            color: getRoleColor(user.role),
                          }}
                        >
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="user-name-text">{user.name || 'Unnamed User'}</span>
                      </td>
                      <td className="user-email-cell">{user.email}</td>
                      <td>
                        <span
                          className="role-badge"
                          style={{
                            backgroundColor: `${getRoleColor(user.role)}18`,
                            color: getRoleColor(user.role),
                          }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>{user.phone || '-'}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <button
                          className="action-btn edit-btn"
                          title="Edit User"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          title="Delete User"
                          onClick={() => handleDelete(user._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (visible < 768px) */}
            <div className="users-mobile-cards-wrap">
              {filteredUsers.map((user) => (
                <div key={user._id} className="admin-user-card glass-card">
                  {/* Card Header: Avatar, Name, Email, and Role Badge */}
                  <div className="user-card-top">
                    <div className="user-card-identity">
                      <div
                        className="user-avatar"
                        style={{
                          backgroundColor: `${getRoleColor(user.role)}18`,
                          color: getRoleColor(user.role),
                        }}
                      >
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="user-card-name-block">
                        <h4>{user.name || 'Unnamed User'}</h4>
                        <span className="user-card-email-sub">{user.email}</span>
                      </div>
                    </div>
                    <span
                      className="role-badge"
                      style={{
                        backgroundColor: `${getRoleColor(user.role)}18`,
                        color: getRoleColor(user.role),
                      }}
                    >
                      {user.role}
                    </span>
                  </div>

                  {/* Card Details: Phone, Joined */}
                  <div className="user-card-body">
                    <div className="user-card-field">
                      <span className="field-label">
                        <Phone size={12} /> Phone
                      </span>
                      <span className="field-value">{user.phone || 'Not provided'}</span>
                    </div>

                    <div className="user-card-field">
                      <span className="field-label">
                        <Calendar size={12} /> Joined
                      </span>
                      <span className="field-value">{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Card Actions: Edit, Delete */}
                  <div className="user-card-actions">
                    <button
                      className="user-card-btn edit"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit size={14} />
                      <span>Edit User</span>
                    </button>
                    <button
                      className="user-card-btn delete"
                      onClick={() => handleDelete(user._id)}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
