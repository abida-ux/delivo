import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useCartUI } from '../../context/CartUIContext';
import { getOrderById } from '../../services/api';
import { getGuestOrderById } from '../../utils/orderStorage';
import './OrderDetails.css';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addItem, clearCart } = useCart();
  const { openCart } = useCartUI();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReordering, setIsReordering] = useState(false);

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

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        if (!user) {
          const guestOrder = getGuestOrderById(orderId);
          if (guestOrder) {
            setOrder(guestOrder);
          } else {
            setError('Unable to load order details.');
          }
          return;
        }

        const response = await getOrderById(orderId);
        setOrder(response);
      } catch (err) {
        setError('Unable to load order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user]);

  const isFailed = order?.paymentStatus === 'failed' || order?.status === 'cancelled';

  const getStatusLabel = () => {
    if (!order) return 'Unknown';
    if (order.paymentStatus === 'failed') return 'Failed';
    return order.status?.replace('-', ' ') || 'Unknown';
  };

  const getTrackingSteps = () => {
    if (!order) return [];

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

  const handleReorder = async () => {
    if (!order?.items?.length) return;
    setIsReordering(true);
    try {
      await clearCart();

      for (const item of order.items) {
        await addItem({
          _id: typeof item.foodId === 'object' && item.foodId !== null ? item.foodId._id : item.foodId,
          name: getOrderItemName(item),
          price: item.price,
          image: getOrderItemImage(item),
        }, item.quantity);
      }

      openCart();
    } catch (err) {
      console.error('Failed to reorder:', err);
    } finally {
      setIsReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="order-details-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Order Details</h1>
        </div>
        <div className="order-details-loading">Loading order...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-page">
        <div className="order-details-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Order Details</h1>
        </div>
        <div className="order-details-empty">
          <h2>{error || 'Order not found.'}</h2>
          <button className="primary-btn" onClick={() => navigate('/customer/orders')}>
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <div className="order-details-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Order #{order._id.slice(-6).toUpperCase()}</h1>
      </div>

      <div className="order-details-card">
        <div className="order-status-row">
          <div className="order-status-badge">
            {order.paymentStatus === 'failed' ? (
              <XCircle size={18} />
            ) : (
              <CheckCircle size={18} />
            )}
            <span>{getStatusLabel()}</span>
          </div>
          <div className="order-meta">
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="order-summary-grid">
          <div className="order-summary-item">
            <h3>Delivery Address</h3>
            <p><MapPin size={16} /> {order.deliveryAddress}</p>
          </div>
          <div className="order-summary-item">
            <h3>Customer</h3>
            <p>{order.customerName || order.guestEmail || 'Guest'}</p>
            {order.whatsappNumber && <p>WhatsApp: {order.whatsappNumber}</p>}
          </div>
          <div className="order-summary-item">
            <h3>Payment</h3>
            <p>{order.paymentMethod?.toUpperCase()}</p>
            <p>{order.paymentStatus === 'failed' ? 'Failed' : order.paymentStatus}</p>
          </div>
          <div className="order-summary-item">
            <h3>Totals</h3>
            <p>Items: {order.items?.length || 0}</p>
            <p>Subtotal: KES {order.items?.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0).toFixed(2)}</p>
            <p>Delivery: KES {order.deliveryFee?.toFixed(2) ?? '0.00'}</p>
            <p><strong>Total: KES {order.totalPrice.toFixed(2)}</strong></p>
          </div>
        </div>

        <div className="tracking-card">
          <h3>Order Tracking</h3>
          <div className="tracking-steps">
            {getTrackingSteps().map((step, index) => (
              <div key={step.label} className={`tracking-step ${step.completed ? 'done' : ''}`}>
                <div className="tracking-dot" />
                <div>
                  <strong>{step.label}</strong>
                  <p>{step.completed ? 'Completed' : index === 0 ? 'In progress' : 'Pending'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {order.failureReason && (
          <div className="order-failure-note">
            <AlertTriangle size={18} />
            <span>{order.failureReason}</span>
          </div>
        )}

        <div className="order-items-list">
          <h2>Items</h2>
          {order.items.map((item) => {
            const food = resolveOrderFood(item);
            const key = food?._id || item.foodId || item.food || item._id || `${item.quantity}-${Math.random()}`;
            return (
              <div key={key} className="order-item-row">
                <div>
                  <p className="item-name">{getOrderItemName(item)}</p>
                  <p className="item-qty">Qty: {item.quantity}</p>
                </div>
                <p className="item-total">KES {(item.price * item.quantity).toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        <div className="order-actions-row">
          <button className="back-btn secondary" onClick={() => navigate('/customer/orders')}>
            Back to Orders
          </button>
          <button
            className="primary-btn"
            onClick={handleReorder}
            disabled={isReordering}
          >
            {isReordering ? 'Reordering...' : 'Reorder from this Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
