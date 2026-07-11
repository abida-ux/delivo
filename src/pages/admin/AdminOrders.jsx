import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Search, DollarSign } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getAllOrders, updateOrder } from '../../services/api';
import AdminEditOrderModal from './AdminEditOrderModal';
import '../pages.css';
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    const filtered = orders.filter(
      (order) =>
        order._id?.includes(value.toUpperCase()) ||
        order.customer?.name?.toLowerCase().includes(value.toLowerCase()) ||
        order.status?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOrders(filtered);
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
                      <td>{order.customer?.name || 'N/A'}</td>
                      <td>{order.restaurant?.name || 'N/A'}</td>
                      <td className="amount">
                        <DollarSign size={16} />
                        {order.totalAmount?.toFixed(2) || '0.00'}
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
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <button
                          className="action-btn view-btn"
                          title="View/Edit Details"
                          onClick={() => handleEdit(order)}
                        >
                          <Eye size={18} />
                        </button>
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
