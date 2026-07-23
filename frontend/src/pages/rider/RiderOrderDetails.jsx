import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext as AuthContextValue } from '../../context/AuthContext.jsx';
import { getOrderById } from '../../services/api';
import '../pages.css';
import './RiderDashboard.css';

const RiderOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const authContext = AuthContextValue ? useContext(AuthContextValue) : null;
  const token = authContext?.token ?? null;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;
      try {
        setLoading(true);
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (error) {
        console.error('Failed to load order details', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, token]);

  if (loading) {
    return <div className="loading-state">Loading order details...</div>;
  }

  if (!order) {
    return <div className="empty-state">Order not found.</div>;
  }

  return (
    <div className="rider-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <div>
            <h1>Delivery Details</h1>
            <p>Order #{(order._id || '').slice(-6).toUpperCase()}</p>
          </div>
          <button className="toggle-btn" onClick={() => navigate('/rider-dashboard')}>Back to Dashboard</button>
        </div>
      </div>

      <div className="profile-section">
        <div className="section-header"><h2>Customer Information</h2></div>
        <div className="info-grid">
          <div className="info-item"><label>Name</label><p>{order.customerName || 'Customer'}</p></div>
          <div className="info-item"><label>Phone</label><p>{order.whatsappNumber || order.guestPhone || 'N/A'}</p></div>
          <div className="info-item"><label>Address</label><p>{order.deliveryAddress}</p></div>
          <div className="info-item"><label>Special Instructions</label><p>{order.specialInstructions || 'None'}</p></div>
        </div>
      </div>

      <div className="profile-section">
        <div className="section-header"><h2>Restaurant Information</h2></div>
        <div className="info-grid">
          <div className="info-item"><label>Restaurant</label><p>{order.restaurantName || 'Restaurant'}</p></div>
          <div className="info-item"><label>Order Status</label><p>{order.status}</p></div>
          <div className="info-item"><label>Payment Status</label><p>{order.paymentStatus}</p></div>
          <div className="info-item"><label>Total Amount</label><p>KES {order.totalPrice}</p></div>
        </div>
      </div>

      <div className="profile-section">
        <div className="section-header"><h2>Items Ordered</h2></div>
        <div className="deliveries-list">
          {(order.items || []).map((item, idx) => (
            <div key={`${item.foodId?._id || idx}`} className="delivery-card">
              <p><strong>{item.foodId?.name || 'Item'}</strong></p>
              <p>Quantity: {item.quantity}</p>
              <p>Price: KES {item.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RiderOrderDetails;
