import { useState, useEffect } from 'react';
import { X, Store } from 'lucide-react';
import './AdminEditUserModal.css';

const AdminEditUserModal = ({ isOpen, user, restaurants = [], onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    restaurantId: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'customer',
        phone: user.phone || '',
        restaurantId: user.restaurant?._id || '',
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'restaurantId') {
      setFormData((prev) => ({
        ...prev,
        restaurantId: value,
        role: value && value !== 'none' ? 'restaurant' : prev.role,
      }));
    } else if (name === 'role') {
      setFormData((prev) => ({
        ...prev,
        role: value,
        restaurantId: value !== 'restaurant' ? '' : prev.restaurantId,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit User</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="customer">Customer</option>
                <option value="restaurant">Restaurant Owner</option>
                <option value="rider">Rider</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '4px' }}>
            <label htmlFor="restaurantId" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Store size={15} color="#16a34a" />
              <span>Link Restaurant (Assign Owner)</span>
            </label>
            <select
              id="restaurantId"
              name="restaurantId"
              value={formData.restaurantId}
              onChange={handleChange}
              style={{
                borderColor: formData.restaurantId ? '#16a34a' : '#cbd5e1',
                backgroundColor: formData.restaurantId ? '#f0fdf4' : '#fff',
              }}
            >
              <option value="">-- No Restaurant Linked --</option>
              {restaurants.map((rest) => {
                const isCurrentOwner = user && (user.restaurant?._id === rest._id || rest.ownerId === user._id);
                const isOwnedByOther = rest.ownerId && (!user || rest.ownerId !== user._id);
                return (
                  <option key={rest._id} value={rest._id}>
                    {rest.name} {isCurrentOwner ? '✓ (Currently Linked)' : isOwnedByOther ? '(Has Existing Owner)' : '(Unassigned)'}
                  </option>
                );
              })}
            </select>
            <p className="field-hint" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
              Assigning a restaurant will set this user's role to "Restaurant Owner" so they can log in and manage the store.
            </p>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditUserModal;
