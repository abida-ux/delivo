import React, { useState, useEffect, useContext } from 'react';
import { Clock, MapPin, DollarSign } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getUserOrders } from '../../services/api';
import '../pages.css';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();

  useEffect(() => {
    const filter = searchParams.get('filter') || 'all';
    setFilterStatus(filter);
  }, [searchParams]);

  useEffect(() => {
    fetchUserOrders();
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      if (!user) {
        console.log('❌ No user logged in');
        setOrders([]);
        return;
      }

      console.log('📝 Fetching orders for user:', user.id);
      const ordersData = await getUserOrders(user.id);
      
      // Handle both array and object responses
      const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData.data || []);
      console.log('✅ Orders fetched:', ordersList);
      setOrders(ordersList);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (order) => {
    if (order.paymentStatus === 'failed') return '#ef4444';

    switch (order.status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'preparing': return '#8b5cf6';
      case 'on-delivery': return '#06b6d4';
      case 'delivered': return '#22c55e';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (order) => {
    if (order.paymentStatus === 'failed') return 'Failed';

    switch (order.status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'on-delivery': return 'On Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'failed') return order.paymentStatus === 'failed' || order.status === 'cancelled';
    return order.status === filterStatus;
  });

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>Track and manage your food orders</p>
      </div>

      <div className="orders-filters">
        <button 
          className={filterStatus === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('all')}
        >
          All
        </button>
        <button 
          className={filterStatus === 'pending' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('pending')}
        >
          Pending
        </button>
        <button 
          className={filterStatus === 'confirmed' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('confirmed')}
        >
          Confirmed
        </button>
        <button 
          className={filterStatus === 'on-delivery' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('on-delivery')}
        >
          On Delivery
        </button>
        <button 
          className={filterStatus === 'delivered' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('delivered')}
        >
          Delivered
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Loading your orders...</p>
        </div>
      ) : !user ? (
        <div className="empty-state">
          <p>Please log in to view your orders</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <p>No orders found</p>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3 className="restaurant-name">Order #{order._id.slice(-6).toUpperCase()}</h3>
                  <p className="order-id">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order) }}
                >
                  {getStatusText(order)}
                </div>
              </div>

              <div className="order-details">
                <div className="detail-item">
                  <Clock size={16} />
                  <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>{order.deliveryAddress}</span>
                </div>
                <div className="detail-item">
                  <span>{order.items?.length || 0} items • KES {order.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="order-actions">
                <button 
                  className="detail-btn"
                  onClick={() => navigate(`/customer/orders/${order._id}`)}
                >
                  View Details
                </button>
                {(order.paymentStatus === 'failed' || order.status === 'delivered') && (
                  <button
                    className="reorder-btn"
                    onClick={async () => {
                      for (const item of order.items) {
                        await addItem({
                          _id: item.foodId._id || item.foodId,
                          name: item.foodId.name || item.foodId,
                          price: item.price,
                          image: item.foodId.image || '',
                        }, item.quantity);
                      }
                      navigate('/customer/cart');
                    }}
                  >
                    Reorder
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
