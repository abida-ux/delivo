import React, { useState } from 'react';
import { Search, Trash2, Ban, Eye, Shield, UserCheck } from 'lucide-react';
import '../pages.css';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      role: 'customer',
      status: 'active',
      joinDate: '2024-01-15',
      orders: 24
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '(555) 987-6543',
      role: 'restaurant_owner',
      status: 'active',
      joinDate: '2024-02-20',
      orders: 156
    },
    {
      id: 3,
      name: 'Michael Brown',
      email: 'michael@example.com',
      phone: '(555) 456-7890',
      role: 'rider',
      status: 'active',
      joinDate: '2024-03-10',
      orders: 248
    },
    {
      id: 4,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '(555) 321-0987',
      role: 'customer',
      status: 'inactive',
      joinDate: '2023-12-05',
      orders: 5
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const roles = ['all', 'customer', 'restaurant_owner', 'rider'];

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleBanUser = (id) => {
    setUsers(users.map(user =>
      user.id === id ? { ...user, status: 'banned' } : user
    ));
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter(user => user.id !== id));
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'customer': return 'Customer';
      case 'restaurant_owner': return 'Restaurant Owner';
      case 'rider': return 'Delivery Rider';
      default: return 'User';
    }
  };

  return (
    <div className="users-management">
      <div className="page-header">
        <h1>Users Management</h1>
        <p>Manage all platform users</p>
      </div>

      <div className="controls-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          {roles.map((role) => (
            <button
              key={role}
              className={filterRole === role ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterRole(role)}
            >
              {role === 'all' ? 'All Users' : getRoleLabel(role)}
            </button>
          ))}
        </div>
      </div>

      <div className="users-table">
        <div className="table-header">
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Status</div>
          <div>Join Date</div>
          <div>Activity</div>
          <div>Actions</div>
        </div>

        {filteredUsers.map((user) => (
          <div key={user.id} className="table-row">
            <div className="cell">
              <div className="user-info">
                <div className="avatar">{user.name.charAt(0)}</div>
                <p>{user.name}</p>
              </div>
            </div>
            <div className="cell">{user.email}</div>
            <div className="cell">
              <span className="role-badge">{getRoleLabel(user.role)}</span>
            </div>
            <div className="cell">
              <span className={`status-badge ${user.status}`}>
                {user.status}
              </span>
            </div>
            <div className="cell">{user.joinDate}</div>
            <div className="cell">
              <span className="activity">{user.orders} orders/deliveries</span>
            </div>
            <div className="cell">
              <div className="actions">
                <button className="action-btn view" title="View details">
                  <Eye size={16} />
                </button>
                <button 
                  className="action-btn ban" 
                  onClick={() => handleBanUser(user.id)}
                  title="Ban user"
                >
                  <Ban size={16} />
                </button>
                <button 
                  className="action-btn delete"
                  onClick={() => handleDeleteUser(user.id)}
                  title="Delete user"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <p>No users found</p>
        </div>
      )}

      <div className="summary-section">
        <div className="summary-item">
          <span>Total Users:</span>
          <strong>{users.length}</strong>
        </div>
        <div className="summary-item">
          <span>Active Users:</span>
          <strong>{users.filter(u => u.status === 'active').length}</strong>
        </div>
        <div className="summary-item">
          <span>Customers:</span>
          <strong>{users.filter(u => u.role === 'customer').length}</strong>
        </div>
        <div className="summary-item">
          <span>Restaurant Owners:</span>
          <strong>{users.filter(u => u.role === 'restaurant_owner').length}</strong>
        </div>
      </div>
    </div>
  );
};

export default Users;
