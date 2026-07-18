import {useState, useEffect} from 'react';
import { getAllStores, getAllStoreTypes, createStore, updateStore, deleteStore } from '../../services/api';
import './AdminStores.css';

const AdminStores = () => {
  const [stores, setStores] = useState([]);
  const [storeTypes, setStoreTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bannerImage: '',
    storeType: '',
    rating: 4.0,
    deliveryTime: '30 mins'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [storesData, typesData] = await Promise.all([
        getAllStores(),
        getAllStoreTypes()
      ]);
      setStores(storesData);
      setStoreTypes(typesData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateStore(editingId, formData);
        alert('Store updated successfully!');
      } else {
        await createStore(formData);
        alert('Store created successfully!');
      }
      setFormData({
        name: '',
        bannerImage: '',
        storeType: '',
        rating: 4.0,
        deliveryTime: '30 mins'
      });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert('Error saving store: ' + err.message);
    }
  };

  const handleEdit = (store) => {
    setFormData({
      name: store.name,
      bannerImage: store.bannerImage,
      storeType: store.storeType._id,
      rating: store.rating,
      deliveryTime: store.deliveryTime
    });
    setEditingId(store._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      try {
        await deleteStore(id);
        alert('Store deleted successfully!');
        fetchData();
      } catch (err) {
        alert('Error deleting store');
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      bannerImage: '',
      storeType: '',
      rating: 4.0,
      deliveryTime: '30 mins'
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-stores-container">
      <div className="admin-header">
        <h1>Manage Stores</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Store'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="store-form">
          <div className="form-group">
            <label>Store Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Sweet Bakery, Pizza Palace"
            />
          </div>

          <div className="form-group">
            <label>Banner Image URL *</label>
            <input
              type="url"
              value={formData.bannerImage}
              onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
              required
              placeholder="https://example.com/banner.png"
            />
          </div>

          <div className="form-group">
            <label>Store Type *</label>
            <select
              value={formData.storeType}
              onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
              required
            >
              <option value="">Select a store type</option>
              {storeTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Rating</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label>Delivery Time</label>
            <input
              type="text"
              value={formData.deliveryTime}
              onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
              placeholder="e.g., 30 mins"
            />
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

      <div className="stores-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Rating</th>
              <th>Delivery Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store._id}>
                <td>{store.name}</td>
                <td>{store.storeType.name}</td>
                <td>⭐ {store.rating}</td>
                <td>{store.deliveryTime}</td>
                <td className="actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(store)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(store._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stores.length === 0 && (
        <div className="empty-state">
          <p>No stores yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
};

export default AdminStores;
