import {useState, useContext} from 'react';
import { User, ShoppingBag, Heart, Wallet, LogOut, Settings, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import '../pages.css';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  // ✅ USE AUTHCONTEXT FOR LOGOUT
  const { logout } = useContext(AuthContext);
  const [customer, setCustomer] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, Apt 4B, City',
    joinedDate: 'January 15, 2024',
    totalOrders: 24,
    walletBalance: 125.50
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(customer);

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    setCustomer(editForm);
    setIsEditing(false);
  };

  const menuItems = [
    {
      icon: ShoppingBag,
      label: 'My Orders',
      path: '/customer/orders',
      count: customer.totalOrders
    },
    {
      icon: Heart,
      label: 'Favorites',
      path: '/customer/favorites',
      count: 8
    },
    {
      icon: Wallet,
      label: 'Wallet',
      path: '/customer/wallet',
      balance: `$${customer.walletBalance.toFixed(2)}`
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '#',
      action: 'settings'
    }
  ];

  const handleLogout = () => {
    // ✅ CLEAR AUTH STATE (SINGLE SOURCE OF TRUTH)
    logout();
    // ✅ NAVIGATE HOME
    navigate('/');
  };

  return (
    <div className="customer-dashboard">
      <div className="dashboard-header">
        <h1>My Account</h1>
      </div>

      <div className="profile-section">
        <div className="profile-avatar">
          <User size={48} />
        </div>

        {!isEditing ? (
          <div className="profile-info">
            <h2 className="profile-name">{customer.name}</h2>
            <p className="profile-email">{customer.email}</p>
            <p className="profile-member">Member since {customer.joinedDate}</p>
            <button className="edit-profile-btn" onClick={handleEdit}>
              Edit Profile
            </button>
          </div>
        ) : (
          <div className="profile-edit-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button className="save-btn" onClick={handleSave}>Save Changes</button>
              <button className="cancel-btn" onClick={handleEdit}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="details-section">
        <div className="detail-item">
          <span className="detail-label">Email</span>
          <span className="detail-value">{customer.email}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Phone</span>
          <span className="detail-value">{customer.phone}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Address</span>
          <span className="detail-value">{customer.address}</span>
        </div>
      </div>

      <div className="menu-section">
        <div className="menu-grid">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="menu-item"
                onClick={() => item.path !== '#' && navigate(item.path)}
              >
                <div className="menu-icon">
                  <Icon size={24} />
                </div>
                <div className="menu-content">
                  <h3>{item.label}</h3>
                  {item.count && <p>{item.count} orders</p>}
                  {item.balance && <p>{item.balance}</p>}
                </div>
                <ArrowRight size={18} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="account-actions">
        <button className="change-password-btn">
          Change Password
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default CustomerDashboard;
