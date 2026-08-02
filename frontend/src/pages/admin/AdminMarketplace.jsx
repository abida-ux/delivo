import { useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getMarketplaceCategories, getMarketplaceProducts, createMarketplaceCategory, createMarketplaceProduct, updateMarketplaceCategory, updateMarketplaceProduct, deleteMarketplaceCategory, deleteMarketplaceProduct, getMarketplaceAdminOverview } from '../../services/api';
import '../pages.css';

const emptyCategory = { name: '', description: '', image: '', icon: '🛍️', categoryType: 'supermarket', isActive: true, sortOrder: 0 };
const emptyProduct = { name: '', description: '', brand: '', categoryType: 'supermarket', category: '', price: 0, discount: 0, stock: 0, images: [], image: '', weightOrSize: '', availability: true, featured: false, prescriptionRequired: false, requiresAgeVerification: false, isActive: true };

const AdminMarketplace = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [overview, setOverview] = useState({ categories: 0, products: 0, lowStockProducts: [] });
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [cats, prodRes, overviewRes] = await Promise.all([
        getMarketplaceCategories(),
        getMarketplaceProducts({ limit: 50 }),
        getMarketplaceAdminOverview(),
      ]);
      setCategories(cats);
      setProducts(prodRes.data || []);
      setOverview(overviewRes || { categories: 0, products: 0, lowStockProducts: [] });
    } catch (error) {
      console.error('Marketplace data failed', error);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategory);
    setEditingCategoryId(null);
  };

  const resetProductForm = () => {
    setProductForm(emptyProduct);
    setEditingProductId(null);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategoryId) {
        await updateMarketplaceCategory(editingCategoryId, categoryForm);
      } else {
        await createMarketplaceCategory(categoryForm);
      }
      resetCategoryForm();
      await loadData();
    } catch (error) {
      console.error('Category save failed', error);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...productForm, images: productForm.images?.length ? productForm.images : [productForm.image].filter(Boolean) };
      if (editingProductId) {
        await updateMarketplaceProduct(editingProductId, payload);
      } else {
        await createMarketplaceProduct(payload);
      }
      resetProductForm();
      await loadData();
    } catch (error) {
      console.error('Product save failed', error);
    }
  };

  const handleDeleteCategory = async (id) => {
    await deleteMarketplaceCategory(id);
    await loadData();
  };

  const handleDeleteProduct = async (id) => {
    await deleteMarketplaceProduct(id);
    await loadData();
  };

  return (
    <AdminDashboardLayout pageTitle="Marketplace Management">
      <div className="admin-dashboard">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <p className="stat-label">Categories</p>
              <h3 className="stat-value">{overview.categories}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <p className="stat-label">Products</p>
              <h3 className="stat-value">{overview.products}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <p className="stat-label">Low stock alerts</p>
              <h3 className="stat-value">{overview.lowStockProducts?.length || 0}</h3>
            </div>
          </div>
        </div>

        <div className="dashboard-info">
          <div className="info-box">
            <h3>Create Category</h3>
            <form onSubmit={handleCategorySubmit} className="checkout-form">
              <input placeholder="Name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
              <input placeholder="Description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
              <input placeholder="Image URL" value={categoryForm.image} onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })} />
              <select value={categoryForm.categoryType} onChange={(e) => setCategoryForm({ ...categoryForm, categoryType: e.target.value })}>
                <option value="supermarket">Supermarket</option>
                <option value="groceries">Groceries</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="liquor">Liquor</option>
              </select>
              <button type="submit" className="cta-button">Save Category</button>
              <button type="button" className="secondary-btn" onClick={resetCategoryForm}>Reset</button>
            </form>
          </div>

          <div className="info-box">
            <h3>Create Product</h3>
            <form onSubmit={handleProductSubmit} className="checkout-form">
              <input placeholder="Product name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
              <input placeholder="Brand" value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} />
              <input placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
              <input placeholder="Image URL" value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} />
              <input type="number" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
              <input type="number" placeholder="Discount" value={productForm.discount} onChange={(e) => setProductForm({ ...productForm, discount: Number(e.target.value) })} />
              <input type="number" placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} />
              <input placeholder="Weight/Size" value={productForm.weightOrSize} onChange={(e) => setProductForm({ ...productForm, weightOrSize: e.target.value })} />
              <select value={productForm.categoryType} onChange={(e) => setProductForm({ ...productForm, categoryType: e.target.value })}>
                <option value="supermarket">Supermarket</option>
                <option value="groceries">Groceries</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="liquor">Liquor</option>
              </select>
              <label><input type="checkbox" checked={productForm.availability} onChange={(e) => setProductForm({ ...productForm, availability: e.target.checked })} /> Available</label>
              <label><input type="checkbox" checked={productForm.featured} onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })} /> Featured</label>
              <label><input type="checkbox" checked={productForm.prescriptionRequired} onChange={(e) => setProductForm({ ...productForm, prescriptionRequired: e.target.checked })} /> Prescription Required</label>
              <label><input type="checkbox" checked={productForm.requiresAgeVerification} onChange={(e) => setProductForm({ ...productForm, requiresAgeVerification: e.target.checked })} /> Age verification required</label>
              <button type="submit" className="cta-button">Save Product</button>
              <button type="button" className="secondary-btn" onClick={resetProductForm}>Reset</button>
            </form>
          </div>
        </div>

        <div className="dashboard-info" style={{ marginTop: '1rem' }}>
          <div className="info-box">
            <h3>Categories</h3>
            {categories.map((category) => (
              <div key={category._id} style={{ borderBottom: '1px solid #eee', padding: '0.6rem 0' }}>
                <strong>{category.name}</strong> ({category.categoryType})
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <button className="cta-button" onClick={() => { setCategoryForm(category); setEditingCategoryId(category._id); }}>Edit</button>
                  <button className="secondary-btn" onClick={() => handleDeleteCategory(category._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          <div className="info-box">
            <h3>Products</h3>
            {products.map((product) => (
              <div key={product._id} style={{ borderBottom: '1px solid #eee', padding: '0.6rem 0' }}>
                <strong>{product.name}</strong> — {product.brand} — stock {product.stock}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <button className="cta-button" onClick={() => { setProductForm(product); setEditingProductId(product._id); }}>Edit</button>
                  <button className="secondary-btn" onClick={() => handleDeleteProduct(product._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminMarketplace;
