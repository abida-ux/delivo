import React, { useState, useEffect } from 'react';
import { getAllStoreTypes, createStoreType, updateStoreType, deleteStoreType } from '../../services/api';
import './AdminStores.css';

const AdminStoreTypes = () => {
  const [storeTypes, setStoreTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    description: '',
    color: '#FF6B35'
  });

  useEffect(() => {
    fetchStoreTypes();
  }, []);

  const fetchStoreTypes = async () => {
    try {
      const data = await getAllStoreTypes();
      setStoreTypes(data);
    } catch (err) {
      console.error('Error fetching store types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateStoreType(editingId, formData);
        alert('Store type updated successfully!');
      } else {
        await createStoreType(formData);
        alert('Store type created successfully!');
      }
      setFormData({ name: '', icon: '', description: '', color: '#FF6B35' });
      setEditingId(null);
      setShowForm(false);
      fetchStoreTypes();
    } catch (err) {
      alert('Error saving store type: ' + err.message);
    }
  };

  const handleEdit = (storeType) => {
    setFormData(storeType);
    setEditingId(storeType._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this store type?')) {
      try {
        await deleteStoreType(id);
        alert('Store type deleted successfully!');
        fetchStoreTypes();
      } catch (err) {
        alert('Error deleting store type');
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', icon: '', description: '', color: '#FF6B35' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-store-types-container">
      <div className="admin-header">
        <h1>Manage Store Types</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Store Type'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="store-type-form">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Bakery, Restaurant, Coffee Shop"
            />
          </div>

          <div className="form-group">
            <label>Icon URL *</label>
            <input
              type="url"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              required
              placeholder="https://example.com/icon.png"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this store type"
            />
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-input">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
              <span>{formData.color}</span>
            </div>
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn-success">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="store-types-grid">
        {storeTypes.map((storeType) => (
          <div key={storeType._id} className="store-type-card">
            <div className="card-image">
              <img src={storeType.icon} alt={storeType.name} />
            </div>
            <div className="card-content">
              <h3>{storeType.name}</h3>
              {storeType.description && <p>{storeType.description}</p>}
              <div className="card-color" style={{ backgroundColor: storeType.color }}></div>
            </div>
            <div className="card-actions">
              <button
                className="btn-edit"
                onClick={() => handleEdit(storeType)}
              >
                Edit
              </button>
              <button
                className="btn-delete"
                onClick={() => handleDelete(storeType._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {storeTypes.length === 0 && (
        <div className="empty-state">
          <p>No store types yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
};

export default AdminStoreTypes;
