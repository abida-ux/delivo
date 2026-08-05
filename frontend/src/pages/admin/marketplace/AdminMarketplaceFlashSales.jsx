import { useState, useEffect } from 'react';
import AdminMarketplaceLayout from '../../../layouts/AdminMarketplaceLayout';
import {
  getMarketplaceFlashSales,
  createMarketplaceFlashSale,
  updateMarketplaceFlashSale,
  deleteMarketplaceFlashSale,
} from '../../../services/api';
import { Flame, Plus, Trash2, Edit } from 'lucide-react';
import '../AdminMarketplace.css';

export default function AdminMarketplaceFlashSales() {
  const [sales, setSales] = useState([]);
  const [editingSale, setEditingSale] = useState(null);
  const [form, setForm] = useState({
    title: 'Weekend Flash Deals',
    discountPercentage: 20,
    active: true,
  });

  useEffect(() => {
    fetchFlashSales();
  }, []);

  const fetchFlashSales = async () => {
    try {
      const data = await getMarketplaceFlashSales();
      setSales(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSale) {
        await updateMarketplaceFlashSale(editingSale._id, form);
      } else {
        await createMarketplaceFlashSale(form);
      }
      setEditingSale(null);
      setForm({ title: 'Weekend Flash Deals', discountPercentage: 20, active: true });
      fetchFlashSales();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save flash sale');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete flash sale?')) {
      await deleteMarketplaceFlashSale(id);
      fetchFlashSales();
    }
  };

  return (
    <AdminMarketplaceLayout pageTitle="Flash Sales Management">
      <div className="admin-mkt-container" style={{ padding: 0 }}>
        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">{editingSale ? 'Edit Flash Sale' : 'Create Flash Sale Event'}</h3>
          <form onSubmit={handleSubmit} className="admin-mkt-grid-form">
            <div className="admin-mkt-field">
              <label>Flash Event Title *</label>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Discount Percentage (%)</label>
              <input type="number" value={form.discountPercentage} onChange={(e) => setForm({ ...form, discountPercentage: Number(e.target.value) })} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
              <button type="submit" className="admin-mkt-btn-primary">Save Flash Sale</button>
              {editingSale && <button type="button" className="admin-mkt-btn-secondary" onClick={() => setEditingSale(null)}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">Flash Sales ({sales.length})</h3>
          <table className="admin-mkt-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Discount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.title}</strong></td>
                  <td>{s.discountPercentage}% OFF</td>
                  <td><span className="admin-mkt-status-badge badge-approved">{s.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="admin-mkt-btn-secondary" onClick={() => { setEditingSale(s); setForm(s); }}><Edit size={14} /></button>
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
