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
      const payload = {
        ...categoryForm,
        slug: categoryForm.slug || categoryForm.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };
      if (editingCategoryId) {
        await updateMarketplaceCategory(editingCategoryId, payload);
      } else {
        await createMarketplaceCategory(payload);
      }
      resetCategoryForm();
      await loadData();
    } catch (error) {
      console.error('Category save failed', error);
      alert(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedCategory = categories.find((item) => item.categoryType === productForm.categoryType);
      const payload = {
        ...productForm,
        category: selectedCategory?._id || productForm.category || '',
        images: productForm.images?.length ? productForm.images : [productForm.image].filter(Boolean),
        image: productForm.image || (productForm.images?.[0] || ''),
        slug: productForm.slug || productForm.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };
      if (editingProductId) {
        await updateMarketplaceProduct(editingProductId, payload);
      } else {
        await createMarketplaceProduct(payload);
      }
      resetProductForm();
      await loadData();
    } catch (error) {
      console.error('Product save failed', error);
      alert(error.response?.data?.message || 'Failed to save product');
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
      <div className="admin-dashboard marketplace-admin-shell">
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

        <div className="dashboard-info marketplace-form-grid">
          <div className="info-box marketplace-form-card">
            <h3>Create Category</h3>
            <form onSubmit={handleCategorySubmit} className="checkout-form marketplace-form">
              <div className="marketplace-form-field">
                <label>Name</label>
                <input placeholder="Name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
              </div>
              <div className="marketplace-form-field">
                <label>Description</label>
                <input placeholder="Description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
              </div>
              <div className="marketplace-form-field">
                <label>Image URL</label>
                <input placeholder="Image URL" value={categoryForm.image} onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })} />
              </div>
              <div className="marketplace-form-field">
                <label>Category Type</label>
                <select value={categoryForm.categoryType} onChange={(e) => setCategoryForm({ ...categoryForm, categoryType: e.target.value })}>
                  <option value="supermarket">Supermarket</option>
                  <option value="groceries">Groceries</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="liquor">Liquor</option>
                </select>
              </div>
              <div className="marketplace-form-actions">
                <button type="submit" className="cta-button">Save Category</button>
                <button type="button" className="secondary-btn" onClick={resetCategoryForm}>Reset</button>
              </div>
            </form>
          </div>

          <div className="info-box marketplace-form-card">
            <h3>Create Product</h3>
            <form onSubmit={handleProductSubmit} className="checkout-form marketplace-form">
              <div className="marketplace-form-field">
                <label>Product Name</label>
                <input placeholder="Product name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
              </div>
              <div className="marketplace-form-field">
                <label>Brand</label>
                <input placeholder="Brand" value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} />
              </div>
              <div className="marketplace-form-field">
                <label>Description</label>
                <input placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
              </div>
              <div className="marketplace-form-field">
                <label>Image URL</label>
                <input placeholder="Image URL" value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} />
              </div>
              <div className="marketplace-form-grid compact-grid">
                <div className="marketplace-form-field">
                  <label>Price</label>
                  <input type="number" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
                </div>
                <div className="marketplace-form-field">
                  <label>Discount</label>
                  <input type="number" placeholder="Discount" value={productForm.discount} onChange={(e) => setProductForm({ ...productForm, discount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="marketplace-form-grid compact-grid">
                <div className="marketplace-form-field">
                  <label>Stock</label>
                  <input type="number" placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} />
                </div>
                <div className="marketplace-form-field">
                  <label>Weight/Size</label>
                  <input placeholder="Weight/Size" value={productForm.weightOrSize} onChange={(e) => setProductForm({ ...productForm, weightOrSize: e.target.value })} />
                </div>
              </div>
              <div className="marketplace-form-field">
                <label>Category Type</label>
                <select value={productForm.categoryType} onChange={(e) => setProductForm({ ...productForm, categoryType: e.target.value })}>
                  <option value="supermarket">Supermarket</option>
                  <option value="groceries">Groceries</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="liquor">Liquor</option>
                </select>
              </div>
              <div className="marketplace-toggle-group">
                <label className="marketplace-checkbox-row"><input type="checkbox" checked={productForm.availability} onChange={(e) => setProductForm({ ...productForm, availability: e.target.checked })} /> Available</label>
                <label className="marketplace-checkbox-row"><input type="checkbox" checked={productForm.featured} onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })} /> Featured</label>
                <label className="marketplace-checkbox-row"><input type="checkbox" checked={productForm.prescriptionRequired} onChange={(e) => setProductForm({ ...productForm, prescriptionRequired: e.target.checked })} /> Prescription Required</label>
                <label className="marketplace-checkbox-row"><input type="checkbox" checked={productForm.requiresAgeVerification} onChange={(e) => setProductForm({ ...productForm, requiresAgeVerification: e.target.checked })} /> Age verification required</label>
              </div>
              <div className="marketplace-form-actions">
                <button type="submit" className="cta-button">Save Product</button>
                <button type="button" className="secondary-btn" onClick={resetProductForm}>Reset</button>
              </div>
            </form>
          </div>
        </div>

        <div className="dashboard-info" style={{ marginTop: '1rem' }}>
          <div className="info-box marketplace-list-card">
            <h3>Categories</h3>
            {categories.map((category) => (
              <div key={category._id} className="marketplace-list-item">
                <div>
                  <strong>{category.name}</strong>
                  <div className="marketplace-pill">{category.categoryType}</div>
                </div>
                <div className="marketplace-form-actions">
                  <button className="cta-button" onClick={() => { setCategoryForm(category); setEditingCategoryId(category._id); }}>Edit</button>
                  <button className="secondary-btn" onClick={() => handleDeleteCategory(category._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          <div className="info-box marketplace-list-card">
            <h3>Products</h3>
            {products.map((product) => (
              <div key={product._id} className="marketplace-list-item">
                <div>
                  <strong>{product.name}</strong>
                  <div className="marketplace-pill">stock {product.stock}</div>
                </div>
                <div className="marketplace-form-actions">
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
