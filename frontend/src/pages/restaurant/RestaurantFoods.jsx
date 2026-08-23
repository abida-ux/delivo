import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Utensils, CheckCircle, XCircle } from 'lucide-react';
import { resolveImageUrl } from '../../utils/placeholderImage';
import './RestaurantDashboard.css';

const RestaurantFoods = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurantName, setRestaurantName] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Fast Food',
    price: '',
    discountPrice: '',
    description: '',
    imageUrl: '',
    isAvailable: true,
  });

  const categories = ['Fast Food', 'Burgers', 'Pizza', 'Drinks', 'Chicken', 'Swahili', 'Desserts', 'Breakfast', 'Main Course'];

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/restaurant/foods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setFoods(json.data || []);
        if (json.restaurantName) {
          setRestaurantName(json.restaurantName);
        }
      }
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: 'Fast Food',
      price: '',
      discountPrice: '',
      description: '',
      imageUrl: '',
      isAvailable: true,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (food) => {
    setEditingFood(food);
    setFormData({
      name: food.name || '',
      category: food.category || 'Fast Food',
      price: food.price || '',
      discountPrice: food.discountPrice || '',
      description: food.description || '',
      imageUrl: food.imageUrl || '',
      isAvailable: food.isAvailable !== false,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateFood = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      alert('Please fill in required fields (Name and Price)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/restaurant/foods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsAddModalOpen(false);
        await fetchFoods();
        alert('Food item added successfully!');
      } else {
        alert(`Error: ${json.message}`);
      }
    } catch (error) {
      console.error('Error adding food:', error);
      alert('Failed to add food item');
    }
  };

  const handleUpdateFood = async (e) => {
    e.preventDefault();
    if (!editingFood) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/restaurant/foods/${editingFood._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsEditModalOpen(false);
        setEditingFood(null);
        await fetchFoods();
        alert('Food item updated successfully!');
      } else {
        alert(`Error: ${json.message}`);
      }
    } catch (error) {
      console.error('Error updating food:', error);
      alert('Failed to update food item');
    }
  };

  const handleToggleAvailability = async (food) => {
    try {
      const token = localStorage.getItem('token');
      const updatedStatus = !food.isAvailable;
      const res = await fetch(`/api/restaurant/foods/${food._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: updatedStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setFoods(foods.map((f) => (f._id === food._id ? { ...f, isAvailable: updatedStatus } : f)));
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleDeleteFood = async (foodId) => {
    if (!window.confirm('Are you sure you want to remove this food item from your menu?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/restaurant/foods/${foodId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setFoods(foods.filter((f) => f._id !== foodId));
        alert('Food item removed successfully');
      } else {
        alert(`Error: ${json.message}`);
      }
    } catch (error) {
      console.error('Error deleting food:', error);
      alert('Failed to delete food item');
    }
  };

  const filteredFoods = foods.filter(
    (f) =>
      f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="restaurant-shell">
      {/* Header */}
      <div className="restaurant-header glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Menu Management{restaurantName ? ` — ${restaurantName}` : ''}</h1>
          <p>Manage food items, prices, and availability for {restaurantName || 'your restaurant'}</p>
        </div>
        <button
          onClick={handleOpenAdd}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
          }}
        >
          <Plus size={18} />
          <span>Add New Food</span>
        </button>
      </div>

      {/* Search Bar & Total Counter */}
      <div className="panel glass-card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '260px' }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search menu items by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
          />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '20px' }}>
          {filteredFoods.length} {filteredFoods.length === 1 ? 'Food Item' : 'Food Items'}
        </span>
      </div>

      {/* Food Grid / Table */}
      <div className="panel glass-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <p>Loading menu items...</p>
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="empty-state">
            <Utensils size={36} color="#cbd5e1" style={{ marginBottom: '12px' }} />
            <p>No food items found on your menu.</p>
            <button onClick={handleOpenAdd} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#16a34a', fontWeight: 600, cursor: 'pointer' }}>
              + Add your first food item
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>Item</th>
                  <th style={{ padding: '12px' }}>Category</th>
                  <th style={{ padding: '12px' }}>Selling Price</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFoods.map((food) => (
                  <tr key={food._id} className="table-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={resolveImageUrl(food.imageUrl)}
                          alt={food.name}
                          style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'https://placehold.co/100?text=Food'; }}
                        />
                        <div>
                          <strong style={{ display: 'block', color: '#0f172a' }}>{food.name}</strong>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{food.description?.slice(0, 45) || 'No description'}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>
                        {food.category || 'General'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '15px' }}>
                        KES {Number(food.price || 0).toLocaleString()}
                        {food.discountPrice && (
                          <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '6px' }}>
                            KES {Number(food.discountPrice).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleToggleAvailability(food)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: 'none',
                          background: food.isAvailable ? '#f0fdf4' : '#fef2f2',
                          color: food.isAvailable ? '#16a34a' : '#dc2626',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {food.isAvailable ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        <span>{food.isAvailable ? 'Available' : 'Out of Stock'}</span>
                      </button>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenEdit(food)}
                          title="Edit Price & Info"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#fff',
                            color: '#334155',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteFood(food._id)}
                          title="Delete Food Item"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #fee2e2',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Food Item */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h2>Add New Food Item</h2>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateFood} className="edit-form">
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Deluxe Cheeseburger"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Selling Price (KES) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 450"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients or details..."
                  rows="2"
                />
              </div>

              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                />
                <label htmlFor="isAvailable">Item is Available / In Stock</label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-save">Add Food Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Food & Price */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h2>Edit Food & Price</h2>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateFood} className="edit-form">
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Selling Price (KES) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                />
              </div>

              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="editIsAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                />
                <label htmlFor="editIsAvailable">Item is Available / In Stock</label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantFoods;
