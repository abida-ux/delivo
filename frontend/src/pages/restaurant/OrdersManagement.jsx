import {useState} from 'react';
import { Clock, CheckCircle, Truck, AlertCircle, Eye } from 'lucide-react';
import '../pages.css';
import './OrdersManagement.css';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([
    {
      id: 'ORD-5001',
      customer: 'John Smith',
      items: [{ name: 'Margherita Pizza', qty: 2 }, { name: 'Garlic Bread', qty: 1 }],
      total: 45.99,
      status: 'processing',
      createdAt: '2024-05-21 18:30',
      estimatedTime: '25 mins'
    },
    {
      id: 'ORD-5002',
      customer: 'Jane Doe',
      items: [{ name: 'Pepperoni Pizza', qty: 1 }, { name: 'Coke', qty: 2 }],
      total: 32.50,
      status: 'ready',
      createdAt: '2024-05-21 19:00',
      estimatedTime: 'Ready for pickup'
    },
    {
      id: 'ORD-5003',
      customer: 'Bob Johnson',
      items: [{ name: 'Caesar Salad', qty: 2 }],
      total: 18.99,
      status: 'on_the_way',
      createdAt: '2024-05-21 18:45',
      estimatedTime: '12 mins'
    },
    {
      id: 'ORD-5004',
      customer: 'Alice Williams',
      items: [{ name: 'Margherita Pizza', qty: 1 }],
      total: 12.99,
      status: 'delivered',
      createdAt: '2024-05-21 17:30',
      estimatedTime: 'Delivered'
    },
    {
      id: 'ORD-5005',
      customer: 'Charlie Brown',
      items: [{ name: 'Large Pizza', qty: 1 }, { name: 'Garlic Bread', qty: 2 }],
      total: 55.75,
      status: 'cancelled',
      createdAt: '2024-05-21 19:15',
      estimatedTime: 'N/A'
    }
  ]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return '#f59e0b';
      case 'ready': return '#3b82f6';
      case 'on_the_way': return '#8b5cf6';
      case 'delivered': return '#22c55e';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing': return <Clock size={16} />;
      case 'ready': return <CheckCircle size={16} />;
      case 'on_the_way': return <Truck size={16} />;
      case 'delivered': return <CheckCircle size={16} />;
      case 'cancelled': return <AlertCircle size={16} />;
      default: return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'processing': return 'Processing';
      case 'ready': return 'Ready';
      case 'on_the_way': return 'On the Way';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  const stats = {
    total: orders.length,
    processing: orders.filter(o => o.status === 'processing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    onTheWay: orders.filter(o => o.status === 'on_the_way').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };

  return (
    <div className="orders-management">
      <div className="page-header">
        <h1>Orders Management</h1>
        <p>Manage and track all incoming orders</p>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <p className="stat-label">Total Orders</p>
          <h3 className="stat-value">{stats.total}</h3>
        </div>
        <div className="stat-item" style={{ borderLeft: `4px solid #f59e0b` }}>
          <p className="stat-label">Processing</p>
          <h3 className="stat-value">{stats.processing}</h3>
        </div>
        <div className="stat-item" style={{ borderLeft: `4px solid #3b82f6` }}>
          <p className="stat-label">Ready</p>
          <h3 className="stat-value">{stats.ready}</h3>
        </div>
        <div className="stat-item" style={{ borderLeft: `4px solid #22c55e` }}>
          <p className="stat-label">Delivered</p>
          <h3 className="stat-value">{stats.delivered}</h3>
        </div>
      </div>

      <div className="filters-section">
        <button 
          className={filterStatus === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('all')}
        >
          All Orders
        </button>
        <button 
          className={filterStatus === 'processing' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('processing')}
        >
          Processing
        </button>
        <button 
          className={filterStatus === 'ready' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('ready')}
        >
          Ready
        </button>
        <button 
          className={filterStatus === 'on_the_way' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('on_the_way')}
        >
          On the Way
        </button>
      </div>

      <div className="orders-container">
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="order-card"
              onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
            >
              <div className="order-header">
                <div className="order-id-section">
                  <h3>{order.id}</h3>
                  <p>{order.customer}</p>
                </div>
                <div 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {getStatusIcon(order.status)}
                  {getStatusText(order.status)}
                </div>
              </div>

              {selectedOrder?.id === order.id && (
                <div className="order-details">
                  <div className="items-list">
                    <h4>Items:</h4>
                    {order.items.map((item, idx) => (
                      <p key={idx}>• {item.name} x{item.qty}</p>
                    ))}
                  </div>
                  <div className="order-meta">
                    <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
                    <p><strong>Order Time:</strong> {order.createdAt}</p>
                    <p><strong>Est. Time:</strong> {order.estimatedTime}</p>
                  </div>

                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="status-actions">
                      <label>Update Status:</label>
                      <div className="action-buttons">
                        {order.status === 'processing' && (
                          <>
                            <button 
                              className="action-btn ready-btn"
                              onClick={() => handleStatusChange(order.id, 'ready')}
                            >
                              Mark as Ready
                            </button>
                            <button 
                              className="action-btn cancel-btn"
                              onClick={() => handleStatusChange(order.id, 'cancelled')}
                            >
                              Cancel Order
                            </button>
                          </>
                        )}
                        {order.status === 'ready' && (
                          <button 
                            className="action-btn on-way-btn"
                            onClick={() => handleStatusChange(order.id, 'on_the_way')}
                          >
                            Mark as On the Way
                          </button>
                        )}
                        {order.status === 'on_the_way' && (
                          <button 
                            className="action-btn delivered-btn"
                            onClick={() => handleStatusChange(order.id, 'delivered')}
                          >
                            Mark as Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersManagement;
