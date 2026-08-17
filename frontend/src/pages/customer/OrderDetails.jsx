import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle, XCircle, AlertTriangle, Phone, Mail, CreditCard, Store, RotateCcw } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useCartUI } from '../../context/CartUIContext';
import { getOrderById } from '../../services/api';
import { getGuestOrderById } from '../../utils/orderStorage';
import './OrderDetails.css';
import SEO from '../../components/SEO';

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

  const formatCurrency = (value) => {
    const amount = Number(value ?? 0);
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getOrderSubtotal = () => {
    if (!order?.items?.length) return 0;
    return order.items.reduce((sum, item) => {
      const unitPrice = Number(item?.price ?? item?.unitPrice ?? 0);
      const quantity = Number(item?.quantity ?? 1);
      return sum + unitPrice * quantity;
    }, 0);
  };

  const getOrderTotal = () => {
    if (order?.expectedTotal) return Number(order.expectedTotal);
    if (order?.totalPrice) return Number(order.totalPrice);
    if (order?.amount) return Number(order.amount);

    const subtotal = getOrderSubtotal();
    const deliveryFee = Number(order?.deliveryFee ?? 0);
    const tax = Number(order?.tax ?? 0);
    return subtotal + deliveryFee + tax;
  };

  useEffect(() => {
    if (!orderId) return undefined;

    const fetchOrder = async (isSilent = false) => {
      try {
        if (!isSilent) {
          setLoading(true);
        }
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
        if (!isSilent) {
          setLoading(false);
        }
      }
    };

    fetchOrder(false);

    const interval = window.setInterval(() => fetchOrder(true), 10000);

    const handleFocus = () => fetchOrder(true);
    const handleVisibility = () => {
      if (!document.hidden) {
        fetchOrder(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [orderId, user]);

  const getStatusBadgeClass = () => {
    if (!order) return 'is-pending';
    if (order.paymentStatus === 'failed') return 'is-failed';
    switch (order.status) {
      case 'pending': return 'is-pending';
      case 'confirmed': return 'is-confirmed';
      case 'preparing': return 'is-active';
      case 'on-delivery': return 'is-active';
      case 'delivered': return 'is-delivered';
      case 'cancelled': return 'is-failed';
      default: return 'is-pending';
    }
  };

  const getStatusLabel = () => {
    if (!order) return 'Unknown';
    if (order.paymentStatus === 'failed') return 'Payment Failed';
    switch (order.status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'on-delivery': return 'On delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'Processing';
    }
  };

  const getTrackingStages = () => {
    if (!order) return [];

    const isPaymentDone = order.paymentStatus === 'completed';
    const isConfirmed = isPaymentDone || ['confirmed', 'preparing', 'on-delivery', 'delivered'].includes(order.status);
    const isPreparing = ['preparing', 'on-delivery', 'delivered'].includes(order.status);
    const isOnDelivery = ['on-delivery', 'delivered'].includes(order.status);
    const isDelivered = order.status === 'delivered';

    let activeIndex = 0;
    if (isDelivered) activeIndex = 4;
    else if (isOnDelivery) activeIndex = 3;
    else if (isPreparing) activeIndex = 2;
    else if (isConfirmed) activeIndex = 1;
    else if (isPaymentDone) activeIndex = 0;

    return [
      { key: 'payment', label: 'Payment', isCompleted: isPaymentDone, isActive: activeIndex === 0 && !isConfirmed },
      { key: 'confirmed', label: 'Confirmed', isCompleted: isConfirmed && activeIndex > 1, isActive: activeIndex === 1 },
      { key: 'preparing', label: 'Preparing', isCompleted: activeIndex > 2, isActive: activeIndex === 2 },
      { key: 'on-delivery', label: 'On the way', isCompleted: activeIndex > 3, isActive: activeIndex === 3 },
      { key: 'delivered', label: 'Delivered', isCompleted: isDelivered, isActive: activeIndex === 4 },
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
        <div className="order-details-inner">
          <div className="order-details-header">
            <button className="details-back-btn" onClick={() => navigate(-1)} title="Go back">
              <ArrowLeft size={18} />
            </button>
            <h1 className="details-title">Order Details</h1>
          </div>
          <div className="order-details-loading-card">
            <div className="details-spinner"></div>
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-page">
        <div className="order-details-inner">
          <div className="order-details-header">
            <button className="details-back-btn" onClick={() => navigate(-1)} title="Go back">
              <ArrowLeft size={18} />
            </button>
            <h1 className="details-title">Order Details</h1>
          </div>
          <div className="order-details-empty-card">
            <h2>{error || 'Order not found.'}</h2>
            <button className="details-pri-btn" onClick={() => navigate('/customer/orders')}>
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stages = getTrackingStages();

  return (
    <div className="order-details-page">
      <SEO
        title={`Order #${order._id.slice(-6).toUpperCase()} Details`}
        description="View complete breakdown, live delivery tracking, and receipt for your Delivo order."
      />
      <div className="order-details-inner">
        
        {/* HEADER */}
        <div className="order-details-header">
          <button className="details-back-btn" onClick={() => navigate(-1)} title="Go back">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="details-title">Order #{order._id.slice(-6).toUpperCase()}</h1>
            <p className="details-time">
              Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="order-details-main-card">
          
          {/* STATUS ROW */}
          <div className="details-status-row">
            <div className={`details-status-badge ${getStatusBadgeClass()}`}>
              <span className="status-dot"></span>
              <span>{getStatusLabel()}</span>
            </div>

            <div className="details-meta-pill">
              <span>{order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}</span>
              <span>•</span>
              <strong className="details-grand-total">{formatCurrency(getOrderTotal())}</strong>
            </div>
          </div>

          {/* MINIMAL PROGRESS TRACKER */}
          {order.status !== 'cancelled' && order.paymentStatus !== 'failed' && (
            <div className="details-tracker-block">
              <h3 className="details-section-label">Order Progress</h3>
              <div className="order-progress-track">
                {stages.map((stage, idx) => (
                  <div
                    key={stage.key}
                    className={`progress-node ${stage.isCompleted ? 'is-completed' : ''} ${stage.isActive ? 'is-active' : ''}`}
                  >
                    <div className="node-indicator">
                      {stage.isCompleted ? (
                        <span className="node-check">✓</span>
                      ) : (
                        <span className="node-dot"></span>
                      )}
                    </div>
                    <span className="node-label">{stage.label}</span>
                    {idx < stages.length - 1 && <div className="node-connector"></div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.failureReason && (
            <div className="details-error-banner">
              <AlertTriangle size={16} />
              <span>{order.failureReason}</span>
            </div>
          )}

          {/* DETAILS GRID */}
          <div className="details-info-grid">
            <div className="details-info-card">
              <h3 className="details-card-label">Delivery destination</h3>
              <div className="details-card-item">
                <MapPin size={14} className="details-icon" />
                <p className="details-text">{order.deliveryAddress || 'Address not specified'}</p>
              </div>
              {order.specialInstructions && (
                <p className="details-subtext">Note: {order.specialInstructions}</p>
              )}
            </div>

            <div className="details-info-card">
              <h3 className="details-card-label">Payment & Contact</h3>
              <div className="details-card-item">
                <CreditCard size={14} className="details-icon" />
                <p className="details-text">
                  {order.paymentMethod?.toUpperCase() || 'M-PESA'} ({order.paymentStatus === 'completed' ? 'Paid' : order.paymentStatus || 'Pending'})
                </p>
              </div>
              {order.whatsappNumber && (
                <div className="details-card-item" style={{ marginTop: '4px' }}>
                  <Phone size={14} className="details-icon" />
                  <p className="details-text">{order.whatsappNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* ITEM BREAKDOWN */}
          <div className="details-items-section">
            <h3 className="details-section-label">Order Items</h3>
            <div className="details-items-list">
              {order.items.map((item, index) => {
                const food = resolveOrderFood(item);
                const key = food?._id || item.foodId || item.food || item._id || index;
                const unitPrice = Number(item.price ?? item.unitPrice ?? food?.price ?? 0);
                const lineTotal = unitPrice * Number(item.quantity ?? 1);

                return (
                  <div key={key} className="details-item-row">
                    <div className="details-item-info">
                      <p className="details-item-name">{getOrderItemName(item)}</p>
                      <p className="details-item-sub">
                        Qty: {item.quantity} • {formatCurrency(unitPrice)} each
                      </p>
                      {(item.restaurantName || item.foodId?.restaurant?.name) && (
                        <span className="details-item-kitchen">
                          <Store size={12} />
                          <span>{item.restaurantName || item.foodId?.restaurant?.name}</span>
                        </span>
                      )}
                      {item.isCombination && item.components && item.components.length > 0 && (
                        <div className="details-combo-box">
                          {item.components.map((comp, compIdx) => (
                            <span key={compIdx}>• {comp.name} ×{comp.quantity}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="details-item-total">{formatCurrency(lineTotal)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOTALS SUMMARY */}
          <div className="details-totals-section">
            <div className="details-total-row">
              <span>Subtotal</span>
              <span>{formatCurrency(getOrderSubtotal())}</span>
            </div>
            <div className="details-total-row">
              <span>Delivery fee</span>
              <span>
                {Number(order.deliveryFee) === 0 ? (
                  <span className="details-free-tag">FREE</span>
                ) : (
                  formatCurrency(order.deliveryFee ?? 0)
                )}
              </span>
            </div>
            {order.tax > 0 && (
              <div className="details-total-row">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
            )}
            <div className="details-total-divider"></div>
            <div className="details-total-row grand-total">
              <span>Total</span>
              <strong className="details-final-price">{formatCurrency(getOrderTotal())}</strong>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="details-actions-footer">
            <button type="button" className="details-sec-btn" onClick={() => navigate('/customer/orders')}>
              ← Back to Orders
            </button>
            <button
              type="button"
              className="details-pri-btn"
              onClick={handleReorder}
              disabled={isReordering}
            >
              <RotateCcw size={14} />
              <span>{isReordering ? 'Reordering...' : 'Reorder Items'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
