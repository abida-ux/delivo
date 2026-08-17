import { useState, useEffect, useContext } from 'react';
import { Clock, MapPin, CreditCard, ShoppingBag, ArrowRight, Check, ChevronRight, RotateCcw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useCartUI } from '../../context/CartUIContext';
import { getUserOrders } from '../../services/api';
import { getGuestOrders } from '../../utils/orderStorage';
import './Orders.css';
import SEO from '../../components/SEO';

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
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getOrderTotal = (order) => {
    if (order?.expectedTotal) return Number(order.expectedTotal);
    if (order?.totalPrice) return Number(order.totalPrice);
    if (order?.amount) return Number(order.amount);

    const subtotal = (order?.items || []).reduce((sum, item) => {
      const unitPrice = Number(item?.price ?? item?.unitPrice ?? 0);
      const quantity = Number(item?.quantity ?? 1);
      return sum + unitPrice * quantity;
    }, 0);

    const deliveryFee = Number(order?.deliveryFee ?? 0);
    const tax = Number(order?.tax ?? 0);
    return subtotal + deliveryFee + tax;
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

  const getStatusText = (order) => {
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

  const getTrackingStages = (order) => {
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

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'failed') return order.paymentStatus === 'failed' || order.status === 'cancelled';
    return order.status === filterStatus;
  });

  return (
    <div className="orders-page-container">
      <SEO
        title="My Orders"
        description="View and track your active, pending, or past orders on Delivo. Follow real-time updates from kitchen preparation to courier delivery."
      />
      <div className="orders-page-inner">
        
        {/* PAGE HEADER */}
        <div className="orders-page-header">
          <h1 className="orders-page-title">My Orders</h1>
          <p className="orders-page-subtitle">Track your food orders and see what's happening in real time.</p>
        </div>

        {/* STATUS FILTER TABS */}
        <div className="orders-filter-bar">
          <button 
            type="button"
            className={`orders-filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setSearchParams({ filter: 'all' })}
          >
            All
          </button>
          <button 
            type="button"
            className={`orders-filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setSearchParams({ filter: 'pending' })}
          >
            Pending
          </button>
          <button 
            type="button"
            className={`orders-filter-tab ${filterStatus === 'confirmed' ? 'active' : ''}`}
            onClick={() => setSearchParams({ filter: 'confirmed' })}
          >
            Confirmed
          </button>
          <button 
            type="button"
            className={`orders-filter-tab ${filterStatus === 'on-delivery' ? 'active' : ''}`}
            onClick={() => setSearchParams({ filter: 'on-delivery' })}
          >
            On delivery
          </button>
          <button 
            type="button"
            className={`orders-filter-tab ${filterStatus === 'delivered' ? 'active' : ''}`}
            onClick={() => setSearchParams({ filter: 'delivered' })}
          >
            Delivered
          </button>
        </div>

        {/* CONTENT LIST */}
        {loading ? (
          <div className="orders-loading-card">
            <div className="orders-loading-spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty-card">
            <ShoppingBag size={42} className="orders-empty-icon" />
            <h3>No orders found</h3>
            <p>Your next meal is waiting. Explore our restaurants and foods to get started!</p>
            <button type="button" className="orders-browse-btn" onClick={() => navigate('/menu')}>
              Browse Menu <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <div className="orders-card-list">
            {filteredOrders.map((order) => {
              const stages = getTrackingStages(order);
              const totalAmount = getOrderTotal(order);

              return (
                <div key={order._id} className="order-item-card">
                  
                  {/* CARD HEADER */}
                  <div className="order-card-header">
                    <div className="order-ref-block">
                      <span className="order-ref-id">Order #{order._id.slice(-6).toUpperCase()}</span>
                      <span className="order-ref-time">
                        {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span className={`order-status-tag ${getStatusBadgeClass(order)}`}>
                      <span className="status-dot"></span>
                      {getStatusText(order)}
                    </span>
                  </div>

                  {/* CARD DETAILS */}
                  <div className="order-card-content">
                    <div className="order-info-col">
                      {/* Items list */}
                      <div className="order-items-summary">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <span key={idx} className="order-item-chip">
                              <strong>{getOrderItemName(item)}</strong> <span className="item-qty">×{item.quantity}</span>
                              {idx < order.items.length - 1 ? ', ' : ''}
                            </span>
                          ))
                        ) : (
                          <span className="order-item-chip">Meal items</span>
                        )}
                      </div>

                      {/* Location & Payment info */}
                      <div className="order-meta-details">
                        {order.deliveryAddress && (
                          <div className="order-meta-item">
                            <MapPin size={13} />
                            <span>{order.deliveryAddress}</span>
                          </div>
                        )}
                        <div className="order-meta-item">
                          <CreditCard size={13} />
                          <span>{order.paymentMethod ? order.paymentMethod.toUpperCase() : 'M-PESA'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Price */}
                    <div className="order-total-block">
                      <span className="order-total-label">Total</span>
                      <strong className="order-total-amount">{formatCurrency(totalAmount)}</strong>
                    </div>
                  </div>

                  {/* MINIMAL PROGRESS TRACKER */}
                  {order.status !== 'cancelled' && order.paymentStatus !== 'failed' && (
                    <div className="order-progress-track">
                      {stages.map((stage, idx) => (
                        <div
                          key={stage.key}
                          className={`progress-node ${stage.isCompleted ? 'is-completed' : ''} ${stage.isActive ? 'is-active' : ''}`}
                        >
                          <div className="node-indicator">
                            {stage.isCompleted ? (
                              <Check size={11} className="node-check" />
                            ) : (
                              <span className="node-dot"></span>
                            )}
                          </div>
                          <span className="node-label">{stage.label}</span>
                          {idx < stages.length - 1 && <div className="node-connector"></div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CARD ACTIONS */}
                  <div className="order-card-footer">
                    <button 
                      type="button"
                      className="order-action-details-btn"
                      onClick={() => navigate(`/customer/orders/${order._id}`)}
                    >
                      <span>View details</span>
                      <ChevronRight size={15} />
                    </button>

                    {(order.paymentStatus === 'failed' || order.status === 'delivered') && (
                      <button
                        type="button"
                        className="order-action-reorder-btn"
                        onClick={() => handleReorder(order)}
                      >
                        <RotateCcw size={13} />
                        <span>Reorder</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default Orders;
