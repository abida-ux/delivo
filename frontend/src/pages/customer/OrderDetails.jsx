import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getOrderById } from '../../services/api';
import './OrderDetails.css';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addItem } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
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

  const handleReorder = async () => {
    if (!order) return;
    setIsReordering(true);
    try {
      for (const item of order.items) {
        await addItem({
          _id: item.foodId._id || item.foodId,
          name: item.foodId.name || item.foodId,
          price: item.price,
          image: item.foodId.image || '',
        }, item.quantity);
      }
      navigate('/customer/cart');
    } catch (err) {
      console.error('Failed to reorder:', err);
    } finally {
      setIsReordering(false);
    }
  };

  if (!user) {
    return (
      <div className="order-details-page">
        <div className="order-details-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Order Details</h1>
        </div>
        <div className="order-details-empty">
          <h2>Please log in to view order details.</h2>
          <button className="primary-btn" onClick={() => navigate('/')}>
            Return Home
          </button>
        </div>
      </div>
    );
  }

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
            <h3>Payment</h3>
            <p>{order.paymentMethod?.toUpperCase()}</p>
            <p>{order.paymentStatus === 'failed' ? 'Failed' : order.paymentStatus}</p>
          </div>
          <div className="order-summary-item">
            <h3>Total</h3>
            <p>KES {order.totalPrice.toFixed(2)}</p>
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
          {order.items.map((item) => (
            <div key={item.foodId._id || item.foodId} className="order-item-row">
              <div>
                <p className="item-name">{item.foodId.name || 'Unknown item'}</p>
                <p className="item-qty">Qty: {item.quantity}</p>
              </div>
              <p className="item-total">KES {(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
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
