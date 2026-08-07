import { useState, useEffect, useMemo } from 'react';
import { Eye, Search, UserCheck, CheckCircle2, Clock, Truck, AlertCircle, XCircle } from 'lucide-react';
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
  const [availableRiders, setAvailableRiders] = useState([]);
  const [availableRidersLoading, setAvailableRidersLoading] = useState(false);
  const [riderSearchTerm, setRiderSearchTerm] = useState('');
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');

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
    const explicit = ((order && order.restaurant && order.restaurant.name) || order.restaurantName || '');
    if (explicit) return explicit;

    const firstItem = (order.items && order.items[0]) || null;
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
        ) : (
          <div className="orders-table-card">
            <div className="table-responsive">
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
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order._id}>
                        <td className="order-id-cell">#{order._id?.slice(-6).toUpperCase()}</td>
                        <td className="customer-cell">{(order.customer && order.customer.name) || order.customerName || order.guestEmail || 'Customer'}</td>
                        <td>{resolveRestaurantName(order)}</td>
                        <td className="amount-cell">{formatCurrency(order.totalPrice || order.totalAmount || 0, 'KSh ')}</td>
                        <td>{renderStatusBadge(order.status)}</td>
                        <td className="date-cell">{order?.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</td>
                        <td className="actions-cell">
                          <button
                            className="order-btn-view"
                            title="View / Edit Details"
                            onClick={() => handleEdit(order)}
                          >
                            <Eye size={16} />
                          </button>
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button
                              className="order-btn-assign"
                              onClick={() => openAssignModal(order)}
                              disabled={assigningOrderId === order._id}
                            >
                              <UserCheck size={15} />
                              <span>Assign</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                        No orders match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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
