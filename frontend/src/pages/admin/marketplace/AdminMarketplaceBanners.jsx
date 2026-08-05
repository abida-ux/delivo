import { useState, useEffect } from 'react';
import AdminMarketplaceLayout from '../../../layouts/AdminMarketplaceLayout';
import {
  getMarketplaceBanners,
  createMarketplaceBanner,
  updateMarketplaceBanner,
  deleteMarketplaceBanner,
} from '../../../services/api';
import { Image, Plus, Trash2, Edit } from 'lucide-react';
import '../AdminMarketplace.css';

export default function AdminMarketplaceBanners() {
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    desktopBanner: '',
    mobileBanner: '',
    buttonText: 'Shop Now',
    buttonLink: '/marketplace/categories',
    enable: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const data = await getMarketplaceBanners({ includeDisabled: 'true' });
      setBanners(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await updateMarketplaceBanner(editingBanner._id, form);
      } else {
        await createMarketplaceBanner(form);
      }
      setEditingBanner(null);
      setForm({ title: '', subtitle: '', desktopBanner: '', mobileBanner: '', buttonText: 'Shop Now', buttonLink: '/marketplace/categories', enable: true });
      fetchBanners();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save banner');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete banner?')) {
      await deleteMarketplaceBanner(id);
      fetchBanners();
    }
  };

  return (
    <AdminMarketplaceLayout pageTitle="Banners & Hero Campaigns">
      <div className="admin-mkt-container" style={{ padding: 0 }}>
        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">{editingBanner ? 'Edit Banner' : 'Create Banner Campaign'}</h3>
          <form onSubmit={handleSubmit} className="admin-mkt-grid-form">
            <div className="admin-mkt-field">
              <label>Campaign Title *</label>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Subtitle</label>
              <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Button Text</label>
              <input type="text" value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Button Link</label>
              <input type="text" value={form.buttonLink} onChange={(e) => setForm({ ...form, buttonLink: e.target.value })} />
            </div>
            <div className="admin-mkt-field" style={{ gridColumn: '1 / -1' }}>
              <label>Desktop Image URL</label>
              <input type="text" value={form.desktopBanner} onChange={(e) => setForm({ ...form, desktopBanner: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
              <button type="submit" className="admin-mkt-btn-primary">Save Banner</button>
              {editingBanner && <button type="button" className="admin-mkt-btn-secondary" onClick={() => setEditingBanner(null)}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">Banners List ({banners.length})</h3>
          <table className="admin-mkt-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subtitle</th>
                <th>Button CTA</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b._id}>
                  <td><strong>{b.title}</strong></td>
                  <td>{b.subtitle}</td>
                  <td>{b.buttonText} ({b.buttonLink})</td>
                  <td><span className="admin-mkt-status-badge badge-approved">{b.enable ? 'Active' : 'Disabled'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="admin-mkt-btn-secondary" onClick={() => { setEditingBanner(b); setForm(b); }}><Edit size={14} /></button>
                      <button className="admin-mkt-btn-danger" onClick={() => handleDelete(b._id)}><Trash2 size={14} /></button>
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
