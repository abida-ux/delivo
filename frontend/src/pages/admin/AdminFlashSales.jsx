import { useState, useEffect } from 'react';
import { Flame, Plus, Search, Trash2, Edit, X, Calendar, Clock, ArrowRight, Check } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import {
  getFoodFlashSales,
  createFoodFlashSale,
  updateFoodFlashSale,
  deleteFoodFlashSale,
  getAllFoods
} from '../../services/api';
import { resolveImageUrl } from '../../utils/placeholderImage';
import { formatCurrency } from '../../utils/currency';
import './AdminFlashSales.css';

export default function AdminFlashSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  // Food catalog
  const [allFoodsList, setAllFoodsList] = useState([]);
  const [foodSearch, setFoodSearch] = useState('');
  const [showFoodDropdown, setShowFoodDropdown] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchFoods();
  }, [filterStatus]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await getFoodFlashSales(filterStatus);
      setSales(data);
    } catch (error) {
      console.error('Error fetching flash sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoods = async () => {
    try {
      const foods = await getAllFoods();
      // Only allow foods that are available and not combinations
      setAllFoodsList(foods.filter(f => !f.isCombination));
    } catch (error) {
      console.error('Error fetching foods for selection:', error);
    }
  };

  const getSaleStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate > now) return { label: 'Upcoming', class: 'upcoming' };
    if (startDate <= now && endDate > now) return { label: 'Active', class: 'active' };
    return { label: 'Expired', class: 'expired' };
  };

  const handleOpenCreateModal = () => {
    setEditingSale(null);
    setTitle('');
    setDescription('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setSelectedItems([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sale) => {
    setEditingSale(sale);
    setTitle(sale.title);
    setDescription(sale.description || '');
    
    // Parse dates and times
    const startObj = new Date(sale.startAt);
    const endObj = new Date(sale.endAt);
    
    setStartDate(startObj.toISOString().split('T')[0]);
    setStartTime(startObj.toTimeString().split(' ')[0].substring(0, 5));
    setEndDate(endObj.toISOString().split('T')[0]);
    setEndTime(endObj.toTimeString().split(' ')[0].substring(0, 5));

    // Map items
    const mapped = sale.items.map(item => ({
      foodId: item.foodId?._id || item.foodId,
      name: item.foodId?.name || 'Food Item',
      image: item.foodId?.image || '',
      restaurantName: item.foodId?.restaurant?.name || 'Delivo Kitchen',
      originalPrice: item.originalPrice,
      salePrice: item.salePrice,
    }));
    setSelectedItems(mapped);
    setIsModalOpen(true);
  };

  const handleAddFoodToSale = (food) => {
    if (selectedItems.some(item => item.foodId === food._id)) {
      alert('This food item is already selected.');
      return;
    }

    const defaultSalePrice = Math.round(food.price * 0.8); // Default 20% discount
    setSelectedItems([...selectedItems, {
      foodId: food._id,
      name: food.name,
      image: food.image,
      restaurantName: food.restaurant?.name || 'Delivo Kitchen',
      originalPrice: food.price,
      salePrice: defaultSalePrice,
    }]);
    setFoodSearch('');
    setShowFoodDropdown(false);
  };

  const handleRemoveFood = (foodId) => {
    setSelectedItems(selectedItems.filter(item => item.foodId !== foodId));
  };

  const handleSalePriceChange = (foodId, value) => {
    const priceNum = parseFloat(value) || 0;
    setSelectedItems(selectedItems.map(item => {
      if (item.foodId === foodId) {
        return { ...item, salePrice: priceNum };
      }
      return item;
    }));
  };

  const handleDeleteSale = async (id) => {
    if (window.confirm('Are you sure you want to delete this flash sale?')) {
      try {
        await deleteFoodFlashSale(id);
        alert('Flash sale deleted successfully.');
        fetchSales();
      } catch (error) {
        console.error('Error deleting flash sale:', error);
        alert('Failed to delete flash sale.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !startDate || !startTime || !endDate || !endTime || selectedItems.length === 0) {
      alert('Please fill out all required fields and select at least one food.');
      return;
    }

    const startAtStr = `${startDate}T${startTime}:00`;
    const endAtStr = `${endDate}T${endTime}:00`;
    const startAt = new Date(startAtStr);
    const endAt = new Date(endAtStr);

    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
      alert('Invalid dates or times provided.');
      return;
    }

    if (endAt <= startAt) {
      alert('End date/time must be after the start date/time.');
      return;
    }

    // Validate sale prices
    for (const item of selectedItems) {
      if (item.salePrice <= 0) {
        alert(`Sale price for ${item.name} must be greater than zero.`);
        return;
      }
      if (item.salePrice >= item.originalPrice) {
        alert(`Sale price for ${item.name} (${item.salePrice}) must be less than the original price (${item.originalPrice}).`);
        return;
      }
    }

    const payload = {
      title,
      description,
      startAt,
      endAt,
      items: selectedItems.map(item => ({
        foodId: item.foodId,
        originalPrice: item.originalPrice,
        salePrice: item.salePrice,
      })),
    };

    try {
      if (editingSale) {
        await updateFoodFlashSale(editingSale._id, payload);
        alert('Flash sale updated successfully!');
      } else {
        await createFoodFlashSale(payload);
        alert('Flash sale created successfully!');
      }
      setIsModalOpen(false);
      fetchSales();
    } catch (error) {
      console.error('Error saving flash sale:', error);
      alert(error.response?.data?.message || 'Failed to save flash sale.');
    }
  };

  const filteredDropdownFoods = allFoodsList.filter(food =>
    food.name.toLowerCase().includes(foodSearch.toLowerCase()) ||
    food.restaurant?.name?.toLowerCase().includes(foodSearch.toLowerCase())
  );

  return (
    <AdminDashboardLayout pageTitle="Flash Sales Management">
      <div className="admin-flash-sales-container">
        
        {/* Upper Action Panel */}
        <div className="flash-sales-controls">
          <div className="status-tabs">
            {['all', 'active', 'upcoming', 'expired'].map(status => (
              <button
                key={status}
                className={`status-tab-btn ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <button className="create-sale-btn" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            Create Flash Sale
          </button>
        </div>

        {/* Table/List */}
        {loading ? (
          <div className="flash-loading-state">
            <div className="flash-spinner"></div>
            <p>Loading flash sales...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="flash-empty-state">
            <Flame size={48} className="empty-icon" />
            <h3>No Flash Sales Found</h3>
            <p>Get started by creating your first food flash sale event!</p>
          </div>
        ) : (
          <div className="flash-sales-table-wrapper">
            <table className="flash-sales-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Foods Count</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => {
                  const status = getSaleStatus(sale.startAt, sale.endAt);
                  return (
                    <tr key={sale._id}>
                      <td className="sale-title-cell">
                        <strong>{sale.title}</strong>
                        {sale.description && <span className="desc-sub">{sale.description}</span>}
                      </td>
                      <td>{sale.items?.length || 0} items</td>
                      <td>
                        <div className="time-badge">
                          <Calendar size={12} />
                          <span>{new Date(sale.startAt).toLocaleDateString()}</span>
                          <Clock size={12} style={{ marginLeft: '6px' }} />
                          <span>{new Date(sale.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td>
                        <div className="time-badge">
                          <Calendar size={12} />
                          <span>{new Date(sale.endAt).toLocaleDateString()}</span>
                          <Clock size={12} style={{ marginLeft: '6px' }} />
                          <span>{new Date(sale.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${status.class}`}>{status.label}</span>
                      </td>
                      <td className="actions-cell" style={{ textAlign: 'right' }}>
                        <button className="edit-action-btn" onClick={() => handleOpenEditModal(sale)}>
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        <button className="delete-action-btn" onClick={() => handleDeleteSale(sale._id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Form */}
        {isModalOpen && (
          <div className="flash-modal-overlay">
            <div className="flash-modal-content">
              <div className="flash-modal-header">
                <h2>{editingSale ? 'Edit Flash Sale Event' : 'Create Flash Sale Event'}</h2>
                <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flash-form">
                <div className="form-group">
                  <label>Flash Sale Event Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekend Super Saver, Midday Munchies"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    placeholder="Provide a brief banner description for customers..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="datetime-row">
                  <div className="form-group half">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group half">
                    <label>Start Time *</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="datetime-row">
                  <div className="form-group half">
                    <label>End Date *</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group half">
                    <label>End Time *</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Food search and selection */}
                <div className="form-group selection-group">
                  <label>Add Foods to Flash Sale *</label>
                  <div className="search-selection-wrapper">
                    <div className="food-search-box">
                      <Search size={18} />
                      <input
                        type="text"
                        placeholder="Search food items or restaurants to add..."
                        value={foodSearch}
                        onChange={(e) => {
                          setFoodSearch(e.target.value);
                          setShowFoodDropdown(true);
                        }}
                        onFocus={() => setShowFoodDropdown(true)}
                      />
                      {foodSearch && (
                        <button type="button" className="clear-search-btn" onClick={() => setFoodSearch('')}>
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {showFoodDropdown && (
                      <div className="food-dropdown-list">
                        {filteredDropdownFoods.length === 0 ? (
                          <div className="no-dropdown-results">No food items found</div>
                        ) : (
                          filteredDropdownFoods.map(food => (
                            <div
                              key={food._id}
                              className="food-dropdown-item"
                              onClick={() => handleAddFoodToSale(food)}
                            >
                              <img src={resolveImageUrl(food.image)} alt={food.name} />
                              <div className="item-details">
                                <span className="item-name">{food.name}</span>
                                <span className="item-rest">{food.restaurant?.name || 'Delivo Kitchen'}</span>
                              </div>
                              <span className="item-price">KES {food.price}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected items list */}
                <div className="selected-foods-list-container">
                  <h3>Selected Foods ({selectedItems.length})</h3>
                  {selectedItems.length === 0 ? (
                    <p className="no-selected-placeholder">No food items selected yet. Use the search bar above to select items.</p>
                  ) : (
                    <div className="selected-items-scroller">
                      {selectedItems.map(item => {
                        const discountPercent = item.originalPrice > 0
                          ? Math.round(((item.originalPrice - item.salePrice) / item.originalPrice) * 100)
                          : 0;

                        return (
                          <div key={item.foodId} className="selected-food-card">
                            <img src={resolveImageUrl(item.image)} alt={item.name} className="selected-food-img" />
                            
                            <div className="selected-food-details">
                              <h4>{item.name}</h4>
                              <span className="rest-label">{item.restaurantName}</span>
                              <div className="pricing-grid">
                                <div className="pricing-val">
                                  <label>Original</label>
                                  <span>KES {item.originalPrice}</span>
                                </div>
                                <div className="pricing-val">
                                  <label>Sale Price (KES) *</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.salePrice}
                                    onChange={(e) => handleSalePriceChange(item.foodId, e.target.value)}
                                  />
                                </div>
                                <div className="pricing-val highlight">
                                  <label>Discount</label>
                                  <span className={discountPercent > 0 ? 'discount-text' : 'discount-text error'}>
                                    {discountPercent > 0 ? `${discountPercent}% OFF` : 'Invalid Price'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="remove-item-btn"
                              onClick={() => handleRemoveFood(item.foodId)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="modal-actions-footer">
                  <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-btn">
                    <Check size={16} />
                    {editingSale ? 'Save Flash Sale' : 'Create Flash Sale'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
