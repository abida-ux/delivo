import { useEffect, useState } from 'react';
import { ShoppingBag, Clock, User, Phone, MapPin, CheckCircle, PackageCheck, Truck, RefreshCw } from 'lucide-react';
import './RestaurantDashboard.css';

const RestaurantOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/restaurant/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
      }
    } catch (error) {
      console.error('Error loading restaurant orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setOrders(orders.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        alert(`Order #${orderId.slice(-6).toUpperCase()} status updated to ${newStatus}`);
      } else {
        alert(`Error: ${json.message}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const statusColors = {
    pending: { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
    confirmed: { bg: '#e0f2fe', color: '#0284c7', label: 'Confirmed' },
    preparing: { bg: '#fae8ff', color: '#c026d3', label: 'Preparing' },
    'on-delivery': { bg: '#dbeafe', color: '#2563eb', label: 'On Delivery' },
    delivered: { bg: '#dcfce7', color: '#16a34a', label: 'Delivered' },
    cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['pending', 'confirmed', 'preparing', 'on-delivery'].includes(order.status);
    return order.status === activeTab;
  });

  return (
    <div className="restaurant-shell">
      {/* Header */}
      <div className="restaurant-header glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Incoming Restaurant Orders</h1>
          <p>Orders placed by customers for your restaurant</p>
        </div>
        <button
          onClick={fetchOrders}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f1f5f9',
            color: '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="panel glass-card" style={{ padding: '12px 20px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'active', label: 'Active Orders' },
          { id: 'pending', label: 'Pending' },
          { id: 'preparing', label: 'Preparing' },
          { id: 'delivered', label: 'Delivered' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              border: 'none',
              background: activeTab === tab.id ? '#16a34a' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              padding: '6px 14px',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="panel glass-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <p>Loading incoming orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={36} color="#cbd5e1" style={{ marginBottom: '12px' }} />
            <p>No orders found for this category.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>Order ID</th>
                  <th style={{ padding: '12px' }}>Customer</th>
                  <th style={{ padding: '12px' }}>Items</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Subtotal</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const statusInfo = statusColors[order.status] || { bg: '#f1f5f9', color: '#475569', label: order.status };
                  const customerName = order.customerName || order.userId?.name || 'Customer';

                  return (
                    <tr key={order._id} className="table-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>
                          #{order._id?.slice(-6).toUpperCase()}
                        </strong>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{customerName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {order.whatsappNumber || order.guestPhone || order.userId?.phone || 'No phone'}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '13px', color: '#334155' }}>
                          {order.items?.map((i) => `${i.quantity}x ${i.foodId?.name || i.name || 'Item'}`).join(', ')}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.color,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#16a34a' }}>
                        KES {Number(order.restaurantSubtotal || order.totalPrice || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                              style={{
                                backgroundColor: '#0284c7',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Confirm
                            </button>
                          )}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'preparing')}
                              style={{
                                backgroundColor: '#c026d3',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Mark Preparing
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            style={{
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Order Details */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px', width: '90%' }}>
            <div className="modal-header">
              <h2>Order #{selectedOrder._id?.slice(-6).toUpperCase()}</h2>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              {/* Customer Info */}
              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#0f172a' }}>
                  <User size={15} color="#16a34a" />
                  <span>{selectedOrder.customerName || selectedOrder.userId?.name || 'Customer'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginTop: '6px' }}>
                  <Phone size={14} />
                  <span>{selectedOrder.whatsappNumber || selectedOrder.guestPhone || selectedOrder.userId?.phone || 'No phone'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginTop: '6px' }}>
                  <MapPin size={14} />
                  <span>{selectedOrder.deliveryAddress || 'No delivery address provided'}</span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e293b' }}>Ordered Items</h4>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '13px' }}>
                      <div>
                        <strong>{item.quantity}x</strong> {item.foodId?.name || item.name || 'Item'}
                      </div>
                      <div style={{ fontWeight: 600, color: '#16a34a' }}>
                        KES {Number((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Subtotal:</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#16a34a' }}>
                  KES {Number(selectedOrder.restaurantSubtotal || selectedOrder.totalPrice || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantOrders;
