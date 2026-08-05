import { useState, useEffect } from 'react';
import AdminMarketplaceLayout from '../../../layouts/AdminMarketplaceLayout';
import {
  getMarketplaceCoupons,
  createMarketplaceCoupon,
  updateMarketplaceCoupon,
  deleteMarketplaceCoupon,
} from '../../../services/api';
import { Ticket, Plus, Trash2, Edit } from 'lucide-react';
import '../AdminMarketplace.css';

export default function AdminMarketplaceCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState({
    code: 'DELIVO10',
    discountType: 'percentage',
    discountValue: 10,
    minPurchase: 1000,
    active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const data = await getMarketplaceCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await updateMarketplaceCoupon(editingCoupon._id, form);
      } else {
        await createMarketplaceCoupon(form);
      }
      setEditingCoupon(null);
      setForm({ code: 'DELIVO10', discountType: 'percentage', discountValue: 10, minPurchase: 1000, active: true });
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete coupon?')) {
      await deleteMarketplaceCoupon(id);
      fetchCoupons();
    }
  };

  return (
    <AdminMarketplaceLayout pageTitle="Coupons & Promo Codes">
      <div className="admin-mkt-container" style={{ padding: 0 }}>
        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">{editingCoupon ? 'Edit Coupon' : 'Create Promo Code'}</h3>
          <form onSubmit={handleSubmit} className="admin-mkt-grid-form">
            <div className="admin-mkt-field">
              <label>Coupon Code *</label>
              <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </div>
            <div className="admin-mkt-field">
              <label>Discount Type</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (KES)</option>
              </select>
            </div>
            <div className="admin-mkt-field">
              <label>Discount Value</label>
              <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
            </div>
            <div className="admin-mkt-field">
              <label>Min Purchase (KES)</label>
              <input type="number" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: Number(e.target.value) })} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
              <button type="submit" className="admin-mkt-btn-primary">Save Coupon</button>
              {editingCoupon && <button type="button" className="admin-mkt-btn-secondary" onClick={() => setEditingCoupon(null)}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">Coupons ({coupons.length})</h3>
          <table className="admin-mkt-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min Purchase</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.code}</strong></td>
                  <td>{c.discountValue}{c.discountType === 'percentage' ? '%' : ' KES'} OFF</td>
                  <td>KES {Number(c.minPurchase || 0).toLocaleString()}</td>
                  <td><span className="admin-mkt-status-badge badge-approved">{c.active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="admin-mkt-btn-secondary" onClick={() => { setEditingCoupon(c); setForm(c); }}><Edit size={14} /></button>
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
