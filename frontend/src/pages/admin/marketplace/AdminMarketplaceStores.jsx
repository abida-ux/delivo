import { useState, useEffect } from 'react';
import AdminMarketplaceLayout from '../../../layouts/AdminMarketplaceLayout';
import {
  getMarketplaceStores,
  createMarketplaceStore,
  updateMarketplaceStore,
  deleteMarketplaceStore,
} from '../../../services/api';
import { Store, Plus, Edit, Trash2 } from 'lucide-react';
import '../AdminMarketplace.css';

export default function AdminMarketplaceStores() {
  const [stores, setStores] = useState([]);
  const [editingStore, setEditingStore] = useState(null);
  const [form, setForm] = useState({
    storeName: '',
    description: '',
    location: 'Nairobi, Kenya',
    owner: 'Delivo Merchant',
    verificationStatus: 'verified',
    rating: 4.8,
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const data = await getMarketplaceStores();
      setStores(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStore) {
        await updateMarketplaceStore(editingStore._id, form);
      } else {
        await createMarketplaceStore(form);
      }
      setEditingStore(null);
      setForm({ storeName: '', description: '', location: 'Nairobi, Kenya', owner: 'Delivo Merchant', verificationStatus: 'verified', rating: 4.8 });
      fetchStores();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save store');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete store?')) {
      await deleteMarketplaceStore(id);
      fetchStores();
    }
  };

  return (
    <AdminMarketplaceLayout pageTitle="Stores Management">
      <div className="admin-mkt-container" style={{ padding: 0 }}>
        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">{editingStore ? 'Edit Store' : 'Add New Merchant Store'}</h3>
          <form onSubmit={handleSubmit} className="admin-mkt-grid-form">
            <div className="admin-mkt-field">
              <label>Store Name *</label>
              <input type="text" required value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Store Owner</label>
              <input type="text" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Verification Status</label>
              <select value={form.verificationStatus} onChange={(e) => setForm({ ...form, verificationStatus: e.target.value })}>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
              <button type="submit" className="admin-mkt-btn-primary">Save Store</button>
              {editingStore && <button type="button" className="admin-mkt-btn-secondary" onClick={() => setEditingStore(null)}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">Registered Stores ({stores.length})</h3>
          <table className="admin-mkt-table">
            <thead>
              <tr>
                <th>Store Name</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.storeName}</strong></td>
                  <td>{s.owner}</td>
                  <td>{s.location}</td>
                  <td><span className="admin-mkt-status-badge badge-approved">{s.verificationStatus}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="admin-mkt-btn-secondary" onClick={() => { setEditingStore(s); setForm(s); }}><Edit size={14} /></button>
                      <button className="admin-mkt-btn-danger" onClick={() => handleDelete(s._id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminMarketplaceLayout>
  );
}
