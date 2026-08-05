import { useState, useEffect } from 'react';
import AdminMarketplaceLayout from '../../../layouts/AdminMarketplaceLayout';
import {
  getMarketplaceProducts,
  createMarketplaceProduct,
  updateMarketplaceProduct,
  deleteMarketplaceProduct,
  duplicateMarketplaceProduct,
  bulkMarketplaceProductAction,
} from '../../../services/api';
import { Package, Plus, Edit, Copy, Trash2, Search, Filter } from 'lucide-react';
import '../AdminMarketplace.css';

export default function AdminMarketplaceProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    brand: '',
    store: 'Delivo Official Store',
    price: '',
    discountPrice: '',
    stock: 20,
    categoryType: 'supermarket',
    image: '',
    condition: 'Brand New',
    featured: false,
    trending: false,
    flashSale: false,
    bestSeller: false,
    newArrival: true,
  });

  useEffect(() => {
    fetchProducts();
  }, [filterType]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = { limit: 100, includeInactive: 'true' };
      if (filterType) params.categoryType = filterType;
      const res = await getMarketplaceProducts(params);
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discountPrice: Number(form.discountPrice || 0),
        stock: Number(form.stock || 0),
        images: form.image ? [form.image] : [],
      };
      if (editingProduct) {
        await updateMarketplaceProduct(editingProduct._id, payload);
      } else {
        await createMarketplaceProduct(payload);
      }
      setEditingProduct(null);
      setForm({
        name: '', description: '', brand: '', store: 'Delivo Official Store', price: '', discountPrice: '', stock: 20, categoryType: 'supermarket', image: '', condition: 'Brand New', featured: false, trending: false, flashSale: false, bestSeller: false, newArrival: true,
      });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDuplicate = async (id) => {
    await duplicateMarketplaceProduct(id);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      await deleteMarketplaceProduct(id);
      fetchProducts();
    }
  };

  const handleBulkAction = async (action) => {
    if (!selectedIds.length) return alert('Select products first');
    if (window.confirm(`Perform '${action}' on ${selectedIds.length} products?`)) {
      await bulkMarketplaceProductAction({ ids: selectedIds, action });
      setSelectedIds([]);
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((p) =>
    !search.trim() || p.name?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminMarketplaceLayout pageTitle="Products Management">
      <div className="admin-mkt-container" style={{ padding: 0 }}>
        {/* Form Card */}
        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit} className="admin-mkt-grid-form">
            <div className="admin-mkt-field">
              <label>Product Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Brand</label>
              <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
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
            <div className="admin-mkt-field">
              <label>Price (KES) *</label>
              <input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Discount Price (KES)</label>
              <input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
            </div>
            <div className="admin-mkt-field">
              <label>Stock Quantity</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div className="admin-mkt-field" style={{ gridColumn: '1 / -1' }}>
              <label>Image URL</label>
              <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
              <label><input type="checkbox" checked={form.trending} onChange={(e) => setForm({ ...form, trending: e.target.checked })} /> Trending</label>
              <label><input type="checkbox" checked={form.flashSale} onChange={(e) => setForm({ ...form, flashSale: e.target.checked })} /> Flash Sale</label>
              <label><input type="checkbox" checked={form.bestSeller} onChange={(e) => setForm({ ...form, bestSeller: e.target.checked })} /> Best Seller</label>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
              <button type="submit" className="admin-mkt-btn-primary">Save Product</button>
              {editingProduct && <button type="button" className="admin-mkt-btn-secondary" onClick={() => setEditingProduct(null)}>Cancel</button>}
            </div>
          </form>
        </div>

        {/* Product Catalog Table */}
        <div className="admin-mkt-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h3 className="admin-mkt-card-title" style={{ margin: 0 }}>Products Catalog ({filteredProducts.length})</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
              {selectedIds.length > 0 && (
                <>
                  <button className="admin-mkt-btn-secondary" onClick={() => handleBulkAction('publish')}>Publish ({selectedIds.length})</button>
                  <button className="admin-mkt-btn-secondary" onClick={() => handleBulkAction('unpublish')}>Unpublish</button>
                  <button className="admin-mkt-btn-danger" onClick={() => handleBulkAction('delete')}>Delete</button>
                </>
              )}
            </div>
          </div>

          <table className="admin-mkt-table">
            <thead>
              <tr>
                <th><input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? filteredProducts.map((p) => p._id) : [])} /></th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Flags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p._id}>
                  <td><input type="checkbox" checked={selectedIds.includes(p._id)} onChange={(e) => setSelectedIds(e.target.checked ? [...selectedIds, p._id] : selectedIds.filter((id) => id !== p._id))} /></td>
                  <td><strong>{p.name}</strong><br /><span style={{ fontSize: 11, color: '#64748b' }}>{p.brand || 'No Brand'}</span></td>
                  <td><span className="admin-mkt-status-badge badge-shipped">{p.categoryType}</span></td>
                  <td>KES {Number(p.price).toLocaleString()}</td>
                  <td>{p.stock}</td>
                  <td>{p.featured && '⭐ Featured '} {p.flashSale && '🔥 Flash '} {p.trending && '📈 Trending'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="admin-mkt-btn-secondary" onClick={() => { setEditingProduct(p); setForm(p); }}><Edit size={14} /></button>
                      <button className="admin-mkt-btn-secondary" onClick={() => handleDuplicate(p._id)}><Copy size={14} /></button>
                      <button className="admin-mkt-btn-danger" onClick={() => handleDelete(p._id)}><Trash2 size={14} /></button>
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
