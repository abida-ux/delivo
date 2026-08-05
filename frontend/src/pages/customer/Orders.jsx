import { useState, useEffect, useContext } from 'react';
import { Clock, MapPin, CreditCard, ShoppingBag, ArrowRight, CheckCircle2, ChevronRight, RotateCcw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useCartUI } from '../../context/CartUIContext';
import { getUserOrders } from '../../services/api';
import { getGuestOrders } from '../../utils/orderStorage';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { openCart } = useCartUI();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem, clearCart } = useCart();
  const filterStatus = searchParams.get('filter') || 'all';

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
    return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getOrderTotal = (order) => {
    const subtotal = (order?.items || []).reduce((sum, item) => {
      const unitPrice = Number(item?.price ?? item?.unitPrice ?? 0);
      const quantity = Number(item?.quantity ?? 1);
      return sum + unitPrice * quantity;
    }, 0);

    const deliveryFee = Number(order?.deliveryFee ?? 0);
    const tax = Number(order?.tax ?? 0);
    return subtotal + deliveryFee + tax;
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
    const fetchUserOrders = async (isSilent = false) => {
      try {
        if (!isSilent) {
          setLoading(true);
        }
        if (!user) {
          const guestOrders = getGuestOrders();
          setOrders(guestOrders);
          return;
        }

        const ordersData = await getUserOrders(user.id);
        const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData.data || []);
        setOrders(ordersList);
      } catch (error) {
        console.error('❌ Error fetching orders:', error);
        setOrders([]);
      } finally {
        if (!isSilent) {
          setLoading(false);
        }
      }
    };

    fetchUserOrders(false);

    const interval = window.setInterval(() => fetchUserOrders(true), 10000);

    const handleFocus = () => fetchUserOrders(true);
    const handleVisibility = () => {
      if (!document.hidden) {
        fetchUserOrders(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  const getStatusBadgeClass = (order) => {
    if (order.paymentStatus === 'failed') return 'status-failed';
    switch (order.status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'preparing': return 'status-preparing';
      case 'on-delivery': return 'status-on-delivery';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
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
      default: return 'Processing';
    }
  };

  const getTrackingSteps = (order) => {
    const paymentCompleted = order.paymentStatus === 'completed';
    const hasOrderReceived = paymentCompleted || ['confirmed', 'preparing', 'on-delivery', 'delivered'].includes(order.status);
    const isPreparing = ['preparing', 'on-delivery', 'delivered'].includes(order.status);
    const isOnDelivery = ['on-delivery', 'delivered'].includes(order.status);
    const isDelivered = order.status === 'delivered';

    return [
      { label: 'Payment', completed: paymentCompleted },
      { label: 'Confirmed', completed: hasOrderReceived },
      { label: 'Preparing', completed: isPreparing },
      { label: 'On The Way', completed: isOnDelivery },
      { label: 'Delivered', completed: isDelivered },
    ];
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'failed') return order.paymentStatus === 'failed' || order.status === 'cancelled';
    return order.status === filterStatus;
  });

  return (
    <div className="orders-page-container">
      <div className="orders-page-inner">
        
        {/* HEADER */}
        <div className="orders-page-header">
          <div>
            <h1 className="orders-page-title">My Orders</h1>
            <p className="orders-page-subtitle">Track and manage all your food & marketplace orders in real time</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="orders-filter-bar">
          <button 
            className={`orders-filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setSearchParams({ filter: 'all' })}
          >
            All Orders
          </button>
          <button 
            className={`orders-filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setSearchParams({ filter: 'pending' })}
          >
            Pending
          </button>
          <button 
            className={`orders-filter-tab ${filterStatus === 'confirmed' ? 'active' : ''}`}
            onClick={() => setSearchParams({ filter: 'confirmed' })}
          >
            Confirmed
          </button>
          <button 
            className={`orders-filter-tab ${filterStatus === 'on-delivery' ? 'active' : ''}`}
            onClick={() => setSearchParams({ filter: 'on-delivery' })}
          >
            On Delivery
          </button>
          <button 
            className={`orders-filter-tab ${filterStatus === 'delivered' ? 'active' : ''}`}
            onClick={() => setSearchParams({ filter: 'delivered' })}
          >
            Delivered
          </button>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="orders-loading-card">
            <div className="orders-loading-spinner"></div>
            <p>Loading your orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty-card">
            <ShoppingBag size={54} className="orders-empty-icon" />
            <h3>No orders found</h3>
            <p>You haven't placed any orders yet. Explore our delicious menu and marketplace to get started!</p>
            <button className="orders-browse-btn" onClick={() => navigate('/meals')}>
              Browse Meals & Food
            </button>
          </div>
        ) : (
          <div className="orders-card-list">
            {filteredOrders.map((order) => (
              <div key={order._id} className="order-item-card">
                
                {/* CARD TOP HEADER */}
                <div className="order-item-header">
                  <div className="order-ref-group">
                    <span className="order-ref-code">Order #{order._id.slice(-6).toUpperCase()}</span>
                    <span className="order-ref-date">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className={`order-status-badge ${getStatusBadgeClass(order)}`}>
                    {getStatusText(order)}
                  </span>
                </div>

                {/* CARD BODY METADATA */}
                <div className="order-item-body">
                  <div className="order-meta-left">
                    <div className="order-summary-preview">
                      <ShoppingBag size={16} className="meta-icon" />
                      <span className="items-text">{getOrderItemsPreview(order)}</span>
                    </div>

                    <div className="order-meta-info-row">
                      <div className="meta-pill">
                        <MapPin size={14} />
                        <span>{order.deliveryAddress || 'Coordinates specified'}</span>
                      </div>
                      <div className="meta-pill">
                        <CreditCard size={14} />
                        <span>{order.paymentMethod?.toUpperCase() || 'M-PESA'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="order-total-price">
                    <span className="total-lbl">Total</span>
                    <span className="total-val">{formatCurrency(getOrderTotal(order))}</span>
                  </div>
                </div>

                {/* HORIZONTAL STEP TRACKER */}
                <div className="order-tracker-container">
                  <div className="tracker-steps-row">
                    {getTrackingSteps(order).map((step, idx) => (
                      <div key={step.label} className={`tracker-step ${step.completed ? 'completed' : ''}`}>
                        <div className="step-circle">
                          {step.completed ? <CheckCircle2 size={14} /> : <span>{idx + 1}</span>}
                        </div>
                        <span className="step-label">{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="order-item-footer">
                  <button 
                    type="button"
                    className="order-btn-details"
                    onClick={() => navigate(`/customer/orders/${order._id}`)}
                  >
                    <span>View Full Details</span>
                    <ChevronRight size={16} />
                  </button>

                  {(order.paymentStatus === 'failed' || order.status === 'delivered') && (
                    <button
                      type="button"
                      className="order-btn-reorder"
                      onClick={() => handleReorder(order)}
                    >
                      <RotateCcw size={15} />
                      <span>Reorder</span>
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Orders;
