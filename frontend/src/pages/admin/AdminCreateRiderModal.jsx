import {useState} from 'react';
import { X } from 'lucide-react';
import './AdminCreateRiderModal.css';

const AdminCreateRiderModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'rider123', // Default password
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter rider name');
      return;
    }
    if (!formData.email.trim()) {
      alert('Please enter email address');
      return;
    }
    if (!formData.phone.trim()) {
      alert('Please enter phone number');
      return;
    }
    if (!formData.password.trim()) {
      alert('Please enter password');
      return;
    }
    
    setLoading(true);
    try {
      console.log('📝 Submitting rider data:', formData);
      await onCreate(formData);
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: 'rider123',
        isActive: true,
      });
      onClose();
    } catch (error) {
      console.error('Error creating rider:', error);
      alert('Failed to create rider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Rider</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter rider name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="text"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Default: rider123"
            />
            <small style={{ color: '#999', marginTop: '4px' }}>
              Leave as default or enter custom password
            </small>
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            <label htmlFor="isActive">Activate this rider immediately</label>
          </div>

          <div className="form-info">
            <strong>Info:</strong> New rider will be created with the role "rider" and can log in with their email.
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-create" disabled={loading}>
              {loading ? 'Creating...' : 'Create Rider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateRiderModal;
