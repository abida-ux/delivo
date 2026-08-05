import { useState, useEffect } from 'react';
import AdminMarketplaceLayout from '../../../layouts/AdminMarketplaceLayout';
import {
  getMarketplaceCategories,
  createMarketplaceCategory,
  updateMarketplaceCategory,
  deleteMarketplaceCategory,
} from '../../../services/api';
import { Layers, Plus, Edit, Trash2 } from 'lucide-react';
import '../AdminMarketplace.css';

export default function AdminMarketplaceCategories() {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({
    name: '',
    categoryType: 'supermarket',
    icon: '🛍️',
    description: '',
    image: '',
    banner: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getMarketplaceCategories({ includeInactive: 'true' });
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateMarketplaceCategory(editingCategory._id, form);
      } else {
        await createMarketplaceCategory(form);
      }
      setEditingCategory(null);
      setForm({ name: '', categoryType: 'supermarket', icon: '🛍️', description: '', image: '', banner: '' });
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this category?')) {
      await deleteMarketplaceCategory(id);
      fetchCategories();
    }
  };

  return (
    <AdminMarketplaceLayout pageTitle="Categories Management">
      <div className="admin-mkt-container" style={{ padding: 0 }}>
        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">{editingCategory ? 'Edit Category' : 'Create New Category'}</h3>
          <form onSubmit={handleSubmit} className="admin-mkt-grid-form">
            <div className="admin-mkt-field">
              <label>Category Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Icon (Emoji or text)</label>
              <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Category Type</label>
              <select value={form.categoryType} onChange={(e) => setForm({ ...form, categoryType: e.target.value })}>
                <option value="supermarket">Supermarket</option>
                <option value="groceries">Groceries</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="liquor">Liquor</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="home">Home & Living</option>
              </select>
            </div>
            <div className="admin-mkt-field" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="admin-mkt-field" style={{ gridColumn: '1 / -1' }}>
              <label>Image URL</label>
              <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
              <button type="submit" className="admin-mkt-btn-primary">Save Category</button>
              {editingCategory && <button type="button" className="admin-mkt-btn-secondary" onClick={() => setEditingCategory(null)}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">Categories List ({categories.length})</h3>
          <table className="admin-mkt-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}>
                  <td><span style={{ fontSize: 20 }}>{c.icon || '🛍️'}</span></td>
                  <td><strong>{c.name}</strong></td>
                  <td><span className="admin-mkt-status-badge badge-shipped">{c.categoryType}</span></td>
                  <td>{c.description || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="admin-mkt-btn-secondary" onClick={() => { setEditingCategory(c); setForm(c); }}><Edit size={14} /></button>
                      <button className="admin-mkt-btn-danger" onClick={() => handleDelete(c._id)}><Trash2 size={14} /></button>
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
