import { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, ArrowRight, RefreshCw, Package, CheckCircle2 } from 'lucide-react';
import { getUnassignedOrders, claimOrder } from '../../services/api';
import '../pages.css';
import './AvailableDeliveries.css';

const AvailableDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const orders = await getUnassignedOrders();
      setDeliveries(orders || []);
    } catch (err) {
      console.error('Failed to fetch available deliveries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 12000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = async (orderId) => {
    try {
      setClaimingId(orderId);
      setFeedback(null);
      const res = await claimOrder(orderId);
      if (res?.success) {
        setFeedback({ type: 'success', text: 'Order claimed successfully! Redirecting...' });
        setDeliveries((prev) => prev.filter((d) => d._id !== orderId));
      } else {
        setFeedback({ type: 'error', text: res?.message || 'Could not claim order.' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Order is no longer available.',
      });
    } finally {
      setClaimingId(null);
      fetchOrders(true);
    }
  };

  return (
    <div className="available-deliveries">
      <div className="page-header">
        <div>
          <h1>Available Deliveries</h1>
          <p>Find and accept live orders waiting for delivery in your area</p>
        </div>
        <button
          className="refresh-btn"
          onClick={() => fetchOrders(true)}
          disabled={refreshing || loading}
        >
          <RefreshCw size={15} className={refreshing ? 'spinning' : ''} />
          <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>

      {feedback && (
        <div className={`feedback-banner ${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="info-banner">
        <span>ℹ️ {deliveries.length} orders currently ready for pickup • Tap 'Grab Order' to accept</span>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw size={24} className="spinning" />
          <p>Scanning area for new delivery orders...</p>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="empty-deliveries-card">
          <Package size={40} className="empty-icon" />
          <h3>No Available Deliveries Right Now</h3>
          <p>New orders will appear automatically as customers place them.</p>
        </div>
      ) : (
        <div className="deliveries-grid">
          {deliveries.map((order) => (
            <div key={order._id} className="delivery-card">
              <div className="delivery-header">
                <span className="order-id">#{order._id?.slice(-6).toUpperCase()}</span>
                <span className="earning-badge">
                  <DollarSign size={13} /> +KSh {order.deliveryFee || 20}
                </span>
              </div>

              <div className="delivery-body">
                <div className="info-row">
                  <span className="label">Restaurant</span>
                  <strong>{order.restaurantName || 'Delivo Restaurant'}</strong>
                </div>

                <div className="info-row">
                  <span className="label">Destination</span>
                  <p className="address">
                    <MapPin size={14} className="pin-icon" />
                    {order.deliveryAddress}
                  </p>
                </div>

                <div className="info-row">
                  <span className="label">Customer</span>
                  <span>{order.customerName || 'Customer'}</span>
                </div>

                <div className="info-row">
                  <span className="label">Total Bill</span>
                  <strong className="total-val">KSh {order.totalPrice}</strong>
                </div>
              </div>

              <button
                className="grab-action-btn"
                onClick={() => handleClaim(order._id)}
                disabled={claimingId === order._id}
              >
                {claimingId === order._id ? (
                  <>
                    <RefreshCw size={15} className="spinning" />
                    <span>Claiming...</span>
                  </>
                ) : (
                  <>
                    <span>Grab Order</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableDeliveries;
