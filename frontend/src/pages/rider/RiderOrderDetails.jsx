import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext as AuthContextValue } from '../../context/AuthContext.jsx';
import { getOrderById, updateOrder } from '../../services/api';
import { ArrowLeft, Phone, MessageCircle, Navigation, MapPin, Truck, CheckCircle2, Package } from 'lucide-react';
import '../pages.css';
import './RiderDashboard.css';

const RiderOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const authContext = AuthContextValue ? useContext(AuthContextValue) : null;
  const user = authContext?.user ?? null;
  const token = authContext?.token ?? null;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  useEffect(() => {
    loadOrder();
  }, [orderId, token]);

  const handleUpdateStatus = async (nextStatus) => {
    if (!order) return;
    try {
      setUpdating(true);
      const res = await updateOrder(order._id, {
        status: nextStatus,
        riderId: order.riderId || user?.id || user?._id,
      });
      if (res?.success) {
        await loadOrder();
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="sick-rider-dashboard">
        <div className="sick-loading-card">
          <div className="sick-spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="sick-rider-dashboard">
        <div className="sick-empty-card">
          <p>Order not found.</p>
          <button className="sick-sec-btn" onClick={() => navigate('/rider-dashboard')}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const phone = order.whatsappNumber || order.guestPhone || '';

  return (
    <div className="sick-rider-dashboard">
      {/* Header */}
      <div className="pane-title-row">
        <button className="sick-sec-btn" onClick={() => navigate('/rider-dashboard')}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <span className="order-chip">Order #{(order._id || '').slice(-6).toUpperCase()}</span>
      </div>

      <div className="sick-active-card">
        <div className="active-card-top">
          <div>
            <h2 className="active-restaurant">{order.restaurantName || 'Delivo Restaurant'}</h2>
            <p className="meta-text">Created: {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="status-pill-badge">{order.status?.replace(/-/g, ' ')}</div>
        </div>

        {/* Customer & Address Details */}
        <div className="active-info-box">
          <div className="info-column">
            <label>Customer Name</label>
            <p>{order.customerName || 'Customer'}</p>
          </div>

          <div className="info-column">
            <label>Contact Phone</label>
            <p>{phone || 'N/A'}</p>
          </div>

          <div className="info-column full-width">
            <label>Delivery Address</label>
            <p className="address-p">
              <MapPin size={18} style={{ color: '#ef4444' }} />
              {order.deliveryAddress}
            </p>
          </div>

          {order.specialInstructions && (
            <div className="info-column full-width">
              <label>Special Instructions</label>
              <p className="instructions-p">"{order.specialInstructions}"</p>
            </div>
          )}

          <div className="info-column">
            <label>Payment Method</label>
            <p style={{ textTransform: 'uppercase' }}>{order.paymentMethod || 'mpesa'}</p>
          </div>

          <div className="info-column">
            <label>Payment Status</label>
            <p>{order.paymentStatus}</p>
          </div>

          <div className="info-column">
            <label>Delivery Fee Earned</label>
            <p className="bold-price">KES {order.deliveryFee || 20}</p>
          </div>

          <div className="info-column">
            <label>Total Order Price</label>
            <p className="bold-price">KES {order.totalPrice}</p>
          </div>
        </div>

        {/* Contact Chips */}
        <div className="contact-actions-bar">
          {phone && (
            <>
              <a href={`tel:${phone}`} className="contact-chip call">
                <Phone size={16} /> Call Customer ({phone})
              </a>
              <a
                href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="contact-chip whatsapp"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            </>
          )}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}
            target="_blank"
            rel="noreferrer"
            className="contact-chip maps"
          >
            <Navigation size={16} /> Open Navigation
          </a>
        </div>

        {/* Items Checklist */}
        <div style={{ marginTop: '10px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} /> Items Ordered ({order.items?.length || 0})
          </h3>
          <div className="available-orders-grid">
            {(order.items || []).map((item, idx) => (
              <div key={item.foodId?._id || idx} className="summary-card">
                <strong style={{ fontSize: '15px' }}>{item.foodId?.name || 'Item'}</strong>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
                  Qty: {item.quantity} × KES {item.price} = <strong>KES {item.quantity * item.price}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="active-card-actions" style={{ marginTop: '14px' }}>
          {order.status === 'assigned' || order.status === 'preparing' || order.status === 'confirmed' ? (
            <button
              className="sick-pri-btn"
              onClick={() => handleUpdateStatus('out-for-delivery')}
              disabled={updating}
            >
              <Truck size={18} /> {updating ? 'Updating...' : 'Start Delivery'}
            </button>
          ) : order.status === 'out-for-delivery' || order.status === 'on-delivery' ? (
            <button
              className="sick-success-btn"
              onClick={() => handleUpdateStatus('delivered')}
              disabled={updating}
            >
              <CheckCircle2 size={18} /> {updating ? 'Completing...' : 'Mark as Delivered'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default RiderOrderDetails;
