import { useState, useEffect, useMemo } from 'react';
import { Eye, Search, UserCheck, CheckCircle2, Clock, Truck, AlertCircle, XCircle, Store, Calendar, DollarSign, Package } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getAllOrders, updateOrder, getAllStores, getAllRestaurants } from '../../services/api';
import AdminEditOrderModal from './AdminEditOrderModal';
import { formatCurrency } from '../../utils/currency';
import '../pages.css';
import './AdminOrders.css';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [storesMap, setStoresMap] = useState({});
  const [restaurantsMap, setRestaurantsMap] = useState({});
  const [allRestaurantsList, setAllRestaurantsList] = useState([]);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [availableRidersLoading, setAvailableRidersLoading] = useState(false);
  const [riderSearchTerm, setRiderSearchTerm] = useState('');
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');

  // Assign restaurant state
  const [isAssignRestModalOpen, setIsAssignRestModalOpen] = useState(false);
  const [selectedOrderForRestAssign, setSelectedOrderForRestAssign] = useState(null);
  const [selectedRestaurantAssignId, setSelectedRestaurantAssignId] = useState('');
  const [assigningRestLoading, setAssigningRestLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchAvailableRiders = async () => {
    try {
      setAvailableRidersLoading(true);
      const token = localStorage.getItem('token');
      const ridersRes = await fetch('/api/orders/rider/available', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ridersData = await ridersRes.json();
      if (ridersData?.success) {
        setAvailableRiders(ridersData.data || []);
      } else {
        setAvailableRiders([]);
      }
    } catch (innerErr) {
      console.warn('Failed to fetch available riders:', innerErr);
      setAvailableRiders([]);
    } finally {
      setAvailableRidersLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [data, ridersRes, storesList, restaurantsList] = await Promise.all([
        getAllOrders().catch(() => []),
        fetch('/api/orders/rider/available', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).then((res) => res.json()).catch(() => ({ success: false })),
        getAllStores().catch(() => []),
        getAllRestaurants().catch(() => []),
      ]);

      const ordersList = Array.isArray(data) ? data : [];
      setOrders(ordersList);
      applyFilter(ordersList, searchTerm, activeFilter);

      setAllRestaurantsList(restaurantsList || []);

      // Clear unseen order badge count
      try {
        const viewedStr = localStorage.getItem('delivo_admin_viewed_orders');
        const viewedIds = viewedStr ? JSON.parse(viewedStr) : [];
        let updated = false;
        ordersList.forEach((o) => {
          if (o._id && !viewedIds.includes(o._id)) {
            viewedIds.push(o._id);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem('delivo_admin_viewed_orders', JSON.stringify(viewedIds));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (err) {
        console.warn('Failed to clear unseen orders:', err);
      }

      if (ridersRes?.success) {
        setAvailableRiders(ridersRes.data || []);
      }

      const storesObj = {};
      (storesList || []).forEach((s) => {
        if (s && s._id) storesObj[String(s._id)] = s;
      });

      const restsObj = {};
      (restaurantsList || []).forEach((r) => {
        if (r && r._id) restsObj[String(r._id)] = r;
      });

      setStoresMap(storesObj);
      setRestaurantsMap(restsObj);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveRestaurantName = (order) => {
    if (order?.restaurants && order.restaurants.length > 0) {
      const names = order.restaurants.map((r) => r.name).filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }

    const itemRestNames = [...new Set((order?.items || []).map((i) => i.restaurantName || i.foodId?.restaurant?.name).filter(Boolean))];
    if (itemRestNames.length > 0) return itemRestNames.join(', ');

    const explicit = ((order && order.restaurant && order.restaurant.name) || order.restaurantName || '');
    if (explicit) return explicit;

    const firstItem = (order?.items && order.items[0]) || null;
    const food = firstItem?.foodId || null;
    if (!food) return 'N/A';

    const storeId = food.store ? String(food.store) : null;
    const restId = food.restaurant ? String(food.restaurant) : null;

    if (storeId && storesMap[storeId]) return storesMap[storeId].name || 'N/A';
    if (restId && restaurantsMap[restId]) return restaurantsMap[restId].name || 'N/A';

    return 'N/A';
  };

  const applyFilter = (list, searchVal, filterVal) => {
    let result = list;
    const q = String(searchVal || '').trim().toLowerCase();
    if (q) {
      result = result.filter((order) => {
        const customerName = ((order && order.customer && order.customer.name) || order.customerName || order.guestEmail || order.guestPhone || '').toString();
        const restaurantName = (resolveRestaurantName(order) || '').toString();
        const id = String(order?._id || '').toString();
        const status = String(order?.status || '');
        return (
          id.toLowerCase().includes(q) ||
          customerName.toLowerCase().includes(q) ||
          restaurantName.toLowerCase().includes(q) ||
          status.toLowerCase().includes(q)
        );
      });
    }

    if (filterVal !== 'ALL') {
      result = result.filter((o) => (o.status || 'pending').toUpperCase() === filterVal);
    }

    setFilteredOrders(result);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    applyFilter(orders, value, activeFilter);
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    applyFilter(orders, searchTerm, filter);
  };

  const renderStatusBadge = (statusStr) => {
    const st = (statusStr || 'pending').toLowerCase();
    if (st === 'delivered' || st === 'completed' || st === 'ready') {
      return <span className="admin-order-badge badge-success"><CheckCircle2 size={13} /> {st}</span>;
    }
    if (st === 'confirmed' || st === 'processing') {
      return <span className="admin-order-badge badge-info"><Clock size={13} /> {st}</span>;
    }
    if (st === 'cancelled') {
      return <span className="admin-order-badge badge-danger"><XCircle size={13} /> {st}</span>;
    }
    return <span className="admin-order-badge badge-warning"><AlertCircle size={13} /> {st}</span>;
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setIsEditModalOpen(true);

    try {
      const viewedStr = localStorage.getItem('delivo_admin_viewed_orders');
      const viewedIds = viewedStr ? JSON.parse(viewedStr) : [];
      if (order?._id && !viewedIds.includes(order._id)) {
        viewedIds.push(order._id);
        localStorage.setItem('delivo_admin_viewed_orders', JSON.stringify(viewedIds));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.warn('Failed to save viewed order status:', err);
    }
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      await updateOrder(editingOrder._id, updatedData);
      setIsEditModalOpen(false);
      setEditingOrder(null);
      await fetchOrders();
      return true;
    } catch (error) {
      alert(`Failed to update order: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  const openAssignModal = (order) => {
    setSelectedOrderForAssignment(order);
    setSelectedRiderId('');
    setRiderSearchTerm('');
    setIsAssignModalOpen(true);
    fetchAvailableRiders();
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedOrderForAssignment(null);
    setSelectedRiderId('');
  };

  const filteredRiderOptions = useMemo(() => {
    const query = riderSearchTerm.trim().toLowerCase();
    return availableRiders.filter((rider) => {
      const name = String(rider.name || '').toLowerCase();
      const email = String(rider.email || '').toLowerCase();
      const phone = String(rider.phone || '').toLowerCase();
      return !query || name.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [availableRiders, riderSearchTerm]);

  const handleAssignRider = async (orderId, riderId = selectedRiderId) => {
    if (!riderId) return;
    try {
      setAssigningOrderId(orderId);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders/rider/assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, riderId }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to assign rider');
      }
      await fetchOrders();
      closeAssignModal();
    } catch (error) {
      alert(error.message || 'Unable to assign rider');
    } finally {
      setAssigningOrderId(null);
    }
  };

  const openAssignRestModal = (order) => {
    setSelectedOrderForRestAssign(order);
    setSelectedRestaurantAssignId(order?.restaurantId?._id || order?.restaurantId || '');
    setIsAssignRestModalOpen(true);
  };

  const closeAssignRestModal = () => {
    setIsAssignRestModalOpen(false);
    setSelectedOrderForRestAssign(null);
    setSelectedRestaurantAssignId('');
  };

  const handleAssignRestaurant = async (orderId, restaurantId = selectedRestaurantAssignId) => {
    if (!restaurantId) return;
    try {
      setAssigningRestLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders/assign-restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, restaurantId }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to assign restaurant');
      }
      alert('Order assigned to restaurant successfully!');
      await fetchOrders();
      closeAssignRestModal();
    } catch (error) {
      alert(error.message || 'Unable to assign restaurant');
    } finally {
      setAssigningRestLoading(false);
    }
  };

  return (
    <AdminDashboardLayout pageTitle="Orders Management">
      <div className="admin-orders-page">
        {/* TOP FILTER & SEARCH BAR */}
        <div className="orders-top-controls">
          <div className="orders-search-input-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by order ID, customer, restaurant, status..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="orders-filter-pills">
            {['ALL', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'].map((f) => (
              <button
                key={f}
                className={`order-filter-pill ${activeFilter === f ? 'active' : ''}`}
                onClick={() => handleFilterClick(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="orders-loading-state">
            <div className="spinner" />
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>No orders match your search criteria.</p>
          </div>
        ) : (
          <div className="orders-table-container">
            {/* Desktop Table View (>= 768px) */}
            <div className="orders-desktop-table-wrap">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Restaurant</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="order-id-cell">#{order._id?.slice(-6).toUpperCase()}</td>
                      <td className="customer-cell">{(order.customer && order.customer.name) || order.customerName || order.guestEmail || 'Customer'}</td>
                      <td>{resolveRestaurantName(order)}</td>
                      <td className="amount-cell">{formatCurrency(order.totalPrice || order.totalAmount || 0, 'KSh ')}</td>
                      <td>{renderStatusBadge(order.status)}</td>
                      <td className="date-cell">{order?.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="order-btn-view"
                          title="View / Edit Details"
                          onClick={() => handleEdit(order)}
                        >
                          <Eye size={16} />
                        </button>
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="order-btn-assign"
                              title="Assign Restaurant"
                              style={{ backgroundColor: '#16a34a', color: '#fff' }}
                              onClick={() => openAssignRestModal(order)}
                            >
                              <Store size={14} />
                              <span>Store</span>
                            </button>
                            <button
                              type="button"
                              className="order-btn-assign"
                              title="Assign Rider"
                              onClick={() => openAssignModal(order)}
                              disabled={assigningOrderId === order._id}
                            >
                              <UserCheck size={14} />
                              <span>Rider</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< 768px) Matching Admin Users & Foods Design System */}
            <div className="orders-mobile-cards-wrap">
              {filteredOrders.map((order) => {
                const customerName = (order.customer && order.customer.name) || order.customerName || order.guestEmail || 'Customer';
                const customerInitial = customerName.charAt(0).toUpperCase() || 'O';
                const restaurantName = resolveRestaurantName(order);
                const orderDate = order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
                const itemCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

                return (
                  <div key={order._id} className="admin-order-card">
                    {/* Card Header: Initial, Order ID, Customer, and Status Badge */}
                    <div className="order-card-top">
                      <div className="order-card-identity">
                        <div className="order-avatar">
                          {customerInitial}
                        </div>
                        <div className="order-card-name-block">
                          <h4>#{order._id?.slice(-6).toUpperCase()} • {customerName}</h4>
                          <span className="order-card-email-sub">{order.customer?.email || order.guestEmail || order.customerPhone || 'Customer Order'}</span>
                        </div>
                      </div>
                      {renderStatusBadge(order.status)}
                    </div>

                    {/* Card Details: Restaurant, Amount, Date, Items */}
                    <div className="order-card-body">
                      <div className="order-card-field">
                        <span className="field-label">
                          <Store size={12} /> Restaurant
                        </span>
                        <span className="field-value" title={restaurantName}>{restaurantName}</span>
                      </div>

                      <div className="order-card-field">
                        <span className="field-label">
                          <DollarSign size={12} /> Amount
                        </span>
                        <span className="field-value amount-highlight">{formatCurrency(order.totalPrice || order.totalAmount || 0, 'KSh ')}</span>
                      </div>

                      <div className="order-card-field">
                        <span className="field-label">
                          <Calendar size={12} /> Date
                        </span>
                        <span className="field-value">{orderDate}</span>
                      </div>

                      <div className="order-card-field">
                        <span className="field-label">
                          <Package size={12} /> Items
                        </span>
                        <span className="field-value">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                      </div>
                    </div>

                    {/* Card Actions: View/Edit, Assign Rider */}
                    <div className="order-card-actions">
                      <button
                        type="button"
                        className="order-card-btn view"
                        onClick={() => handleEdit(order)}
                      >
                        <Eye size={14} /> View Details
                      </button>
                      {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                        <>
                          <button
                            type="button"
                            className="order-card-btn assign"
                            style={{ backgroundColor: '#16a34a', color: '#fff' }}
                            onClick={() => openAssignRestModal(order)}
                          >
                            <Store size={14} /> Assign Store
                          </button>
                          <button
                            type="button"
                            className="order-card-btn assign"
                            onClick={() => openAssignModal(order)}
                            disabled={assigningOrderId === order._id}
                          >
                            <UserCheck size={14} /> Assign Rider
                          </button>
                        </>
                      ) : (
                        <div className="order-card-status-closed">
                          <span>Complete</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isAssignRestModalOpen && selectedOrderForRestAssign && (
        <div className="modal-overlay" onClick={closeAssignRestModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Restaurant to Order</h3>
              <button className="modal-close" onClick={closeAssignRestModal}>×</button>
            </div>
            <p className="assignment-summary">
              Order #{selectedOrderForRestAssign._id?.slice(-6).toUpperCase()} — Customer: {selectedOrderForRestAssign.customerName || 'Customer'}
            </p>
            <div className="assign-form" style={{ marginTop: '12px' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px', fontSize: '13.5px', color: '#334155' }}>
                Select Restaurant:
              </label>
              <select
                value={selectedRestaurantAssignId}
                onChange={(e) => setSelectedRestaurantAssignId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  backgroundColor: '#f8fafc',
                  outline: 'none',
                }}
              >
                <option value="">-- Choose Restaurant --</option>
                {allRestaurantsList.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} {r.email ? `(${r.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-cancel" onClick={closeAssignRestModal}>Cancel</button>
              <button
                type="button"
                className="btn-save"
                onClick={() => handleAssignRestaurant(selectedOrderForRestAssign._id)}
                disabled={!selectedRestaurantAssignId || assigningRestLoading}
              >
                {assigningRestLoading ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAssignModalOpen && selectedOrderForAssignment && (
        <div className="modal-overlay" onClick={closeAssignModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Rider</h3>
              <button className="modal-close" onClick={closeAssignModal}>×</button>
            </div>
            <p className="assignment-summary">Order #{selectedOrderForAssignment._id?.slice(-6).toUpperCase()} - {selectedOrderForAssignment.customerName || 'Customer'}</p>
            <div className="assign-form">
              <label htmlFor="riderSearch">Search riders</label>
              <input
                id="riderSearch"
                type="text"
                value={riderSearchTerm}
                onChange={(e) => setRiderSearchTerm(e.target.value)}
                placeholder="Search by name, phone, or email"
              />
            </div>
            {availableRidersLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading riders...</p>
              </div>
            ) : filteredRiderOptions.length === 0 ? (
              <p className="empty-riders">No riders are currently available.</p>
            ) : (
              <div className="rider-list">
                {filteredRiderOptions.map((rider) => (
                  <button
                    key={rider._id}
                    type="button"
                    className={`rider-card ${selectedRiderId === rider._id ? 'selected' : ''}`}
                    onClick={() => setSelectedRiderId(rider._id)}
                  >
                    <div className="rider-card-left">
                      <div className="rider-avatar">{rider.name?.charAt(0) || 'R'}</div>
                      <div>
                        <p className="rider-name">{rider.name || rider.email}</p>
                        <p className="rider-meta">{rider.phone || rider.email}</p>
                      </div>
                    </div>
                    <div className="rider-card-right">
                      <span className="status-badge available">Available</span>
                      <p className="rider-meta">Completed: {rider.totalDeliveries || 0}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={closeAssignModal}>Cancel</button>
              <button type="button" className="btn-save" onClick={() => handleAssignRider(selectedOrderForAssignment._id)} disabled={!selectedRiderId || assigningOrderId === selectedOrderForAssignment._id}>
                {assigningOrderId === selectedOrderForAssignment._id ? 'Assigning...' : 'Assign Rider'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminEditOrderModal
        isOpen={isEditModalOpen}
        order={editingOrder}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingOrder(null);
        }}
        onSave={handleSaveEdit}
      />
    </AdminDashboardLayout>
  );
}
