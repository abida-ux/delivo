import React, { useState, useEffect, useContext } from 'react';
import { Clock, MapPin, DollarSign } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useCartUI } from '../../context/CartUIContext';
import { getUserOrders } from '../../services/api';
import { getGuestOrders } from '../../utils/orderStorage';
import '../pages.css';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { openCart } = useCartUI();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchParams] = useSearchParams();
  const { addItem, clearCart } = useCart();

  const resolveOrderFood = (item) => {
    if (!item) return null;
    if (typeof item.foodId === 'object' && item.foodId !== null) return item.foodId;
    if (typeof item.food === 'object' && item.food !== null) return item.food;
    return null;
  };

  const getOrderItemName = (item) => {
    const food = resolveOrderFood(item);
    return food?.name || food?.title || item.name || item.foodName || 'Food item';
  };

  const getOrderItemImage = (item) => {
    const food = resolveOrderFood(item);
    return food?.image || item.image || '';
  };

  const getOrderItemsPreview = (order) => {
    const names = (order.items || []).map(getOrderItemName);
    return names.length === 0 ? 'No items' : names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2} more` : '');
  };

  const handleReorder = async (order) => {
    if (!order?.items?.length) return;

    await clearCart();

    for (const item of order.items) {
      const food = resolveOrderFood(item);
      await addItem({
        _id: food?._id || item.foodId || item.food || item._id,
        name: getOrderItemName(item),
        price: item.price || food?.price || 0,
        image: getOrderItemImage(item),
      }, item.quantity);
    }

    openCart();
  };

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
        const guestOrders = getGuestOrders();
        console.log('🧾 Guest orders loaded from storage:', guestOrders);
        setOrders(guestOrders);
        return;
      }

      console.log('📝 Fetching orders for user:', user.id);
      const ordersData = await getUserOrders(user.id);

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

  const getTrackingSteps = (order) => {
    const paymentCompleted = order.paymentStatus === 'completed';
    const hasOrderReceived = paymentCompleted || ['confirmed', 'preparing', 'on-delivery', 'delivered'].includes(order.status);
    const isPreparing = ['preparing', 'on-delivery', 'delivered'].includes(order.status);
    const isOnDelivery = ['on-delivery', 'delivered'].includes(order.status);
    const isDelivered = order.status === 'delivered';

    return [
      { label: 'Payment received', completed: paymentCompleted },
      { label: 'Order received', completed: hasOrderReceived },
      { label: 'Preparing', completed: isPreparing },
      { label: 'On the way', completed: isOnDelivery },
      { label: 'Delivered', completed: isDelivered },
    ];
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

              <p className="order-items-preview">{getOrderItemsPreview(order)}</p>

              <div className="tracking-strip">
                {getTrackingSteps(order).map((step, index) => {
                  const isActive = !step.completed && index === 1 && order.paymentStatus === 'completed';
                  return (
                    <div
                      key={step.label}
                      className={`tracking-pill ${step.completed ? 'done' : isActive ? 'active' : ''}`}
                    >
                      {step.label}
                    </div>
                  );
                })}
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
                    onClick={() => handleReorder(order)}
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
