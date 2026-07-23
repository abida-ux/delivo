import {useState, useEffect} from 'react';
import { Eye, Search, UserCheck } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getAllOrders, updateOrder } from '../../services/api';
import AdminEditOrderModal from './AdminEditOrderModal';
import { formatCurrency } from '../../utils/currency';
import { getAllStores, getAllRestaurants } from '../../services/api';
import '../pages.css';
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [storesMap, setStoresMap] = useState({});
  const [restaurantsMap, setRestaurantsMap] = useState({});
  const [availableRiders, setAvailableRiders] = useState([]);
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      setOrders(data);
      setFilteredOrders(data);

      try {
        const token = localStorage.getItem('token');
        const ridersRes = await fetch('/api/orders/rider/available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ridersData = await ridersRes.json();
        if (ridersData?.success) {
          setAvailableRiders(ridersData.data || []);
        }
      } catch (innerErr) {
        console.warn('Failed to fetch available riders:', innerErr);
      }

      // Bulk fetch all stores and restaurants once to avoid many per-id requests
      try {
        const [storesList, restaurantsList] = await Promise.all([getAllStores(), getAllRestaurants()]);
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
      } catch (innerErr) {
        // If bulk fetch fails, continue without maps
        console.warn('Failed to fetch stores/restaurants in bulk:', innerErr);
      }
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

  const handleSearch = (value) => {
    try {
      console.debug('[AdminOrders] search:', value);
      setSearchTerm(value);
      const q = String(value || '').trim().toLowerCase();
      if (!q) {
        setFilteredOrders(orders);
        return;
      }

      const filtered = orders.filter((order) => {
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

      // if nothing matched, keep filtered empty so UI shows "No orders found"
      setFilteredOrders(filtered);
    } catch (err) {
      console.error('Search error:', err);
      setFilteredOrders(orders);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      preparing: '#8b5cf6',
      ready: '#22c55e',
      delivered: '#059669',
      cancelled: '#ef4444',
    };
    return colors[status?.toLowerCase()] || '#666';
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      await updateOrder(editingOrder._id, updatedData);
      setIsEditModalOpen(false);
      setEditingOrder(null);
      await fetchOrders();
      alert('Order updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      alert(`Failed to update order: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  const openAssignModal = (order) => {
    setSelectedOrderForAssignment(order);
    setSelectedRiderId('');
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedOrderForAssignment(null);
    setSelectedRiderId('');
  };

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
      alert('Rider assigned successfully');
    } catch (error) {
      console.error('Assignment failed:', error);
      alert(error.message || 'Unable to assign rider');
    } finally {
      setAssigningOrderId(null);
    }
  };

  return (
    <AdminDashboardLayout pageTitle="Orders Management">
      <div className="admin-orders">
        <div className="orders-header">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by order ID, customer name or status..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : (
          <div className="orders-table-container">
            {filteredOrders.length > 0 ? (
              <table className="orders-table">
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
                      <td className="order-id">#{order._id?.slice(-6).toUpperCase()}</td>
                      <td>{(order.customer && order.customer.name) || order.customerName || order.guestEmail || 'N/A'}</td>
                      <td>{resolveRestaurantName(order)}</td>
                      <td className="amount">
                        {formatCurrency(order.totalPrice || order.totalAmount || 0, 'KSh ')}
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: `${getStatusColor(order.status)}20`,
                            color: getStatusColor(order.status),
                          }}
                        >
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      <td>{order?.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</td>
                      <td className="actions-cell">
                        <button
                          className="action-btn view-btn"
                          title="View/Edit Details"
                          onClick={() => handleEdit(order)}
                        >
                          <Eye size={18} />
                        </button>
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            className="action-btn assign-btn"
                            title="Assign Rider"
                            onClick={() => openAssignModal(order)}
                            disabled={assigningOrderId === order._id}
                          >
                            <UserCheck size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>No orders found</p>
              </div>
            )}
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
            {availableRiders.length === 0 ? (
              <p className="empty-riders">No riders are currently available.</p>
            ) : (
              <div className="assign-form">
                <label htmlFor="riderSelect">Available Riders</label>
                <select id="riderSelect" value={selectedRiderId} onChange={(e) => setSelectedRiderId(e.target.value)}>
                  <option value="">Select a rider</option>
                  {availableRiders.map((rider) => (
                    <option key={rider._id} value={rider._id}>{rider.name} • {rider.email}</option>
                  ))}
                </select>
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
};

export default AdminOrders;
