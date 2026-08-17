import { useContext, useEffect, useMemo, useState, useRef } from 'react';
import {
  Clock,
  DollarSign,
  MapPin,
  RefreshCcw,
  Truck,
  CheckCircle2,
  Zap,
  History,
  User as UserIcon,
  Phone,
  MessageCircle,
  Navigation,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Package,
  LogOut,
  Utensils,
  Bike,
  X,
  Power,
  Radio,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext as AuthContextValue } from '../../context/AuthContext.jsx';
import { getOrderById, updateOrder, getUnassignedOrders, claimOrder, getAPIUrl } from '../../services/api';
import '../pages.css';
import './RiderDashboard.css';

const RiderDashboard = () => {
  const navigate = useNavigate();
  const authContext = AuthContextValue ? useContext(AuthContextValue) : null;
  const user = authContext?.user ?? null;
  const token = authContext?.token ?? null;

  const [profile, setProfile] = useState(null);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'active' | 'history' | 'profile'
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });
  const [notificationToast, setNotificationToast] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('live'); // 'live' | 'recent' | 'reconnecting'
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const shownNotificationIds = useRef(new Set());

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 4000);
  };

  const fetchDashboardData = async (isSilent = false) => {
    if (!user?._id && !user?.id) return;
    try {
      if (!isSilent) setLoading(true);
      const apiUrl = getAPIUrl();
      const [profileRes, assignedRes, unassignedData] = await Promise.all([
        fetch(`${apiUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json()),
        fetch(`${apiUrl}/orders/rider/assigned`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json()),
        getUnassignedOrders().catch(() => []),
      ]);

      if (profileRes?.success) {
        const normalizedProfile = {
          ...profileRes.data,
          riderStatus:
            profileRes.data?.riderStatus === 'on-delivery' ? 'on-delivery' : profileRes.data?.riderStatus || 'available',
        };
        setProfile(normalizedProfile);
      }

      if (assignedRes?.success) {
        const ordersList = assignedRes.data || [];
        setAssignedOrders(ordersList);
      }

      setUnassignedOrders(unassignedData || []);
      setConnectionStatus('live');
    } catch (error) {
      console.error('Failed to load rider dashboard data', error);
      setConnectionStatus('reconnecting');
      if (!isSilent) showToast('Failed to refresh data', 'error');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const pollInterval = setInterval(() => {
      fetchDashboardData(true);
    }, 12000);
    return () => clearInterval(pollInterval);
  }, [token, user]);

  useEffect(() => {
    if (!token || (!user?._id && !user?.id)) return undefined;

    const loadNotifications = async () => {
      try {
        const apiUrl = getAPIUrl();
        const response = await fetch(`${apiUrl}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        const assignmentNotification = (data?.notifications || []).find((notification) => {
          if (notification?.isRead) return false;
          const title = String(notification?.title || '').toLowerCase();
          const message = String(notification?.message || '').toLowerCase();
          return (
            title.includes('delivery') ||
            title.includes('assigned') ||
            message.includes('assigned') ||
            message.includes('delivery')
          );
        });

        if (assignmentNotification && !shownNotificationIds.current.has(assignmentNotification._id)) {
          shownNotificationIds.current.add(assignmentNotification._id);
          setNotificationToast({
            title: assignmentNotification.title,
            message: assignmentNotification.message,
          });

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(assignmentNotification.title, { body: assignmentNotification.message });
          }
        }
      } catch (error) {
        console.error('Failed to load rider notifications', error);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 15000);
    return () => window.clearInterval(interval);
  }, [token, user]);

  // Filter active vs completed orders
  const activeDeliveries = useMemo(() => {
    return assignedOrders.filter((order) =>
      ['assigned', 'out-for-delivery', 'on-delivery', 'preparing', 'confirmed'].includes(order.status)
    );
  }, [assignedOrders]);

  const completedDeliveries = useMemo(() => {
    return assignedOrders.filter((order) => order.status === 'delivered');
  }, [assignedOrders]);

  const todayCompletedCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return completedDeliveries.filter(
      (order) => new Date(order.deliveryCompletedAt || order.updatedAt || order.createdAt).toDateString() === todayStr
    ).length;
  }, [completedDeliveries]);

  const todayEarningsCalculated = useMemo(() => {
    const todayStr = new Date().toDateString();
    return completedDeliveries
      .filter(
        (order) => new Date(order.deliveryCompletedAt || order.updatedAt || order.createdAt).toDateString() === todayStr
      )
      .reduce((sum, order) => sum + (Number(order.deliveryFee) || 20), 0);
  }, [completedDeliveries]);

  const totalEarningsCalculated = useMemo(() => {
    if (profile?.totalEarnings !== undefined && profile?.totalEarnings !== null) {
      return Number(profile.totalEarnings);
    }
    return completedDeliveries.reduce((sum, order) => sum + (Number(order.deliveryFee) || 20), 0);
  }, [profile, completedDeliveries]);

  const handleGrabOrder = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const res = await claimOrder(orderId);
      if (res?.success) {
        showToast('Order grabbed! Added to your active deliveries.', 'success');
        setActiveTab('active');
        await fetchDashboardData(true);
      } else {
        showToast(res?.message || 'Unable to grab order.', 'error');
      }
    } catch (err) {
      console.error('Grab order error', err);
      showToast(err.response?.data?.message || err.message || 'This order was already grabbed.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateOrderStatus = async (order, nextStatus) => {
    try {
      setActionLoadingId(order._id);
      const response = await updateOrder(order._id, {
        status: nextStatus,
        riderId: order.riderId || user?.id || user?._id,
      });

      if (response?.success) {
        if (nextStatus === 'out-for-delivery') {
          showToast('Delivery started! Drive safely.');
        } else if (nextStatus === 'delivered') {
          showToast('Delivery completed successfully! Fee added to your earnings.');
        }
        await fetchDashboardData(true);
      }
    } catch (error) {
      console.error('Status update failed', error);
      showToast(error.response?.data?.message || 'Failed to update status. Please try again.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const promptToggleStatus = () => {
    if (profile?.riderStatus === 'on-delivery') {
      showToast('Cannot change duty status while delivering an active order.', 'error');
      return;
    }
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    try {
      setStatusSubmitting(true);
      const newStatus = profile?.riderStatus === 'offline' ? 'available' : 'offline';
      const token = localStorage.getItem('token');
      const apiUrl = getAPIUrl();
      const res = await fetch(`${apiUrl}/users/me/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ riderStatus: newStatus }),
      });
      const data = await res.json();
      if (data?.success || res.ok) {
        setProfile((prev) => ({ ...prev, riderStatus: newStatus }));
        showToast(`Duty status updated to ${newStatus.toUpperCase()}`);
        setStatusModalOpen(false);
      } else {
        showToast(data?.message || 'Could not update duty status', 'error');
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
      showToast('Failed to update status', 'error');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getAPIUrl();
      await fetch(`${apiUrl}/users/me/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ riderStatus: 'offline' }),
      });
    } catch (err) {
      console.error('Failed to set offline status on logout', err);
    }
    authContext?.logout();
  };

  const getStepNumber = (status) => {
    switch (status) {
      case 'assigned':
      case 'confirmed':
      case 'preparing':
        return 1;
      case 'out-for-delivery':
      case 'on-delivery':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 1;
    }
  };

  const formatCompactAddress = (addr) => {
    if (!addr) return 'Delivery Address';
    const cleanAddr = addr.replace(/\[Landmark:[^\]]*\]/gi, '').trim();
    const parts = cleanAddr
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[1]}`;
    }
    return parts[0] || cleanAddr;
  };

  const getDutyStateInfo = () => {
    if (profile?.riderStatus === 'on-delivery') {
      return {
        dotClass: 'busy',
        label: 'ON DELIVERY',
        sublabel: 'Currently delivering',
        pillClass: 'is-busy',
      };
    }
    if (profile?.riderStatus === 'offline') {
      return {
        dotClass: 'offline',
        label: 'OFFLINE',
        sublabel: "You're offline",
        pillClass: 'is-offline',
      };
    }
    return {
      dotClass: 'online',
      label: 'ONLINE',
      sublabel: 'Ready for deliveries',
      pillClass: 'is-online',
    };
  };

  const dutyState = getDutyStateInfo();

  return (
    <div className="sick-rider-dashboard">
      {/* Top Header Card (2-Row Responsive Layout) */}
      <div className="rider-compact-header glass-card">
        <div className="header-top-row">
          <div className="rider-identity">
            <div className="rider-avatar-box">
              <span>{profile?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'R'}</span>
              <div className={`status-bubble ${dutyState.dotClass}`} />
            </div>
            <div className="rider-name-block">
              <div className="name-row">
                <h2>{profile?.name || user?.name || 'Delivo Rider'}</h2>
                <span className="partner-chip">
                  <ShieldCheck size={12} /> Partner
                </span>
              </div>
            </div>
          </div>

          <div className="header-actions-row">
            <button
              className="header-icon-btn"
              onClick={() => fetchDashboardData()}
              title="Refresh feed"
              disabled={loading}
            >
              <RefreshCcw size={15} className={loading ? 'spinning' : ''} />
            </button>
            <button className="header-logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>

        <div className="header-duty-row">
          <div className="duty-status-indicator">
            <span className={`duty-dot ${dutyState.dotClass}`}></span>
            <span className="duty-text">
              <strong>{dutyState.label}</strong> — {dutyState.sublabel}
            </span>
          </div>

          <button
            className={`duty-toggle-switch ${dutyState.pillClass}`}
            onClick={promptToggleStatus}
            disabled={profile?.riderStatus === 'on-delivery'}
            title={profile?.riderStatus === 'on-delivery' ? 'Cannot toggle status while on delivery' : 'Toggle Online/Offline Duty'}
          >
            <div className="switch-knob"></div>
            <span className="switch-text">
              {profile?.riderStatus === 'on-delivery'
                ? 'On Duty'
                : profile?.riderStatus === 'offline'
                ? 'Go Online'
                : 'Go Offline'}
            </span>
          </button>
        </div>
      </div>

      {/* Modern 4-Stat Metrics Ribbon (2x2 on mobile) */}
      <div className="rider-stats-ribbon">
        <div className="metric-card orange" onClick={() => setActiveTab('available')}>
          <div className="metric-icon-box orange">
            <Zap size={16} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Available</span>
            <strong className="metric-val">{unassignedOrders.length}</strong>
          </div>
        </div>

        <div className="metric-card blue" onClick={() => setActiveTab('active')}>
          <div className="metric-icon-box blue">
            <Truck size={16} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Active</span>
            <strong className="metric-val">{activeDeliveries.length}</strong>
          </div>
        </div>

        <div className="metric-card green" onClick={() => setActiveTab('history')}>
          <div className="metric-icon-box green">
            <CheckCircle2 size={16} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Delivered Today</span>
            <strong className="metric-val">{todayCompletedCount}</strong>
          </div>
        </div>

        <div className="metric-card green-highlight" onClick={() => navigate('/rider/earnings')}>
          <div className="metric-icon-box green-highlight">
            <DollarSign size={16} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Today's Earnings</span>
            <strong className="metric-val">KES {todayEarningsCalculated.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Actionable Assignment Notification Toast */}
      {notificationToast && (
        <div className="actionable-delivery-toast glass-card">
          <div className="toast-header">
            <div className="toast-badge">
              <Zap size={13} /> NEW DELIVERY ASSIGNED
            </div>
            <button className="toast-close" onClick={() => setNotificationToast(null)}>
              <X size={15} />
            </button>
          </div>
          <div className="toast-content">
            <h4>{notificationToast.title}</h4>
            <p>{notificationToast.message}</p>
          </div>
          <div className="toast-actions">
            <button
              className="view-delivery-btn"
              onClick={() => {
                setActiveTab('active');
                setNotificationToast(null);
              }}
            >
              <span>View Active Delivery</span>
              <ArrowRight size={14} />
            </button>
            <button className="dismiss-btn" onClick={() => setNotificationToast(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Floating System Toast */}
      {toastMessage.text && (
        <div className={`compact-toast ${toastMessage.type}`}>
          <Sparkles size={16} />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Rider Navigation Tabs (Equal 4 Columns on Mobile) */}
      <div className="rider-tabs-bar">
        <button
          className={`rider-tab-btn ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          <div className="tab-btn-content">
            <Zap size={15} />
            <span>Available</span>
            {unassignedOrders.length > 0 && <span className="tab-pill orange">{unassignedOrders.length}</span>}
          </div>
        </button>

        <button
          className={`rider-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <div className="tab-btn-content">
            <Truck size={15} />
            <span>Active</span>
            {activeDeliveries.length > 0 && <span className="tab-pill blue">{activeDeliveries.length}</span>}
          </div>
        </button>

        <button
          className={`rider-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <div className="tab-btn-content">
            <History size={15} />
            <span>History</span>
          </div>
        </button>

        <button
          className={`rider-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <div className="tab-btn-content">
            <UserIcon size={15} />
            <span>Profile</span>
          </div>
        </button>
      </div>

      {/* ================= TAB 1: AVAILABLE DELIVERIES ================= */}
      {activeTab === 'available' && (
        <div className="tab-pane-content">
          <div className="feed-header-row">
            <div className="feed-title-block">
              <h3>Available Deliveries</h3>
              <p>Grab orders immediately to add them to your delivery queue</p>
            </div>
            <div className="live-status-pill">
              {connectionStatus === 'live' ? (
                <>
                  <span className="pulse-green-dot"></span>
                  <span>Live Feed</span>
                </>
              ) : (
                <>
                  <span className="pulse-amber-dot"></span>
                  <span>Reconnecting...</span>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="rider-loading-box">
              <RefreshCcw size={24} className="spinning orange-text" />
              <p>Scanning area for new delivery orders...</p>
            </div>
          ) : unassignedOrders.length === 0 ? (
            <div className="rider-empty-box">
              <div className="empty-icon-circle">
                <Package size={32} />
              </div>
              <h4>No Available Deliveries Right Now</h4>
              <p>New customer orders will appear here automatically. Keep your app open.</p>
              <button className="manual-refresh-btn" onClick={() => fetchDashboardData()}>
                <RefreshCcw size={14} /> Refresh Feed
              </button>
            </div>
          ) : (
            <div className="available-cards-grid">
              {unassignedOrders.map((order) => {
                const itemCount = Array.isArray(order.items)
                  ? order.items.reduce((sum, it) => sum + (it.quantity || 1), 0)
                  : 1;

                return (
                  <div key={order._id} className="available-delivery-card glass-card">
                    {/* Card Header: Order ID (Left) + Prominent Green Earnings Pill (Right) */}
                    <div className="card-top-header">
                      <span className="order-tag">#{order._id?.slice(-6).toUpperCase()}</span>
                      <div className="earnings-hero-badge">
                        <span className="plus-sign">+</span>
                        <span className="currency">KES</span>
                        <strong className="amount">{order.deliveryFee || 20}</strong>
                      </div>
                    </div>

                    {/* Visual Route Timeline: Pickup ➔ Drop-off */}
                    <div className="route-timeline">
                      <div className="route-point pickup">
                        <div className="point-icon-circle pickup-icon">
                          <Utensils size={11} />
                        </div>
                        <div className="point-info">
                          <span className="point-label">PICKUP</span>
                          <h4 className="point-title">
                            {order.restaurants && order.restaurants.length > 1
                              ? `${order.restaurants.map((r) => r.name).filter(Boolean).join(' & ')} (${order.restaurants.length} Stops)`
                              : order.restaurantName || 'Delivo Restaurant'}
                          </h4>
                        </div>
                      </div>

                      <div className="route-line-connector">
                        <span className="line-dot"></span>
                      </div>

                      <div className="route-point dropoff">
                        <div className="point-icon-circle dropoff-icon">
                          <MapPin size={11} />
                        </div>
                        <div className="point-info">
                          <span className="point-label">DROP-OFF</span>
                          <p className="point-address">{formatCompactAddress(order.deliveryAddress)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Strip: Distance, Time, Items */}
                    <div className="order-meta-strip">
                      {order.distance ? (
                        <div className="meta-chip">
                          <Bike size={11} />
                          <span>{order.distance} km</span>
                        </div>
                      ) : null}

                      {order.estimatedTime || order.estimatedDeliveryTime ? (
                        <div className="meta-chip">
                          <Clock size={11} />
                          <span>~{order.estimatedTime || order.estimatedDeliveryTime} min</span>
                        </div>
                      ) : null}

                      <div className="meta-chip items-chip">
                        <Package size={11} />
                        <span>
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>

                    {/* Primary Touch-Friendly Grab CTA Button */}
                    <button
                      className="grab-order-btn"
                      onClick={() => handleGrabOrder(order._id)}
                      disabled={actionLoadingId === order._id || profile?.riderStatus === 'offline'}
                    >
                      {actionLoadingId === order._id ? (
                        <>
                          <RefreshCcw size={14} className="spinning" />
                          <span>Claiming...</span>
                        </>
                      ) : (
                        <>
                          <span>GRAB ORDER</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: ACTIVE DELIVERY ================= */}
      {activeTab === 'active' && (
        <div className="tab-pane-content">
          <div className="feed-header-row">
            <div className="feed-title-block">
              <h3>Active Deliveries</h3>
              <p>Manage your current orders and update delivery steps</p>
            </div>
            <span className="count-tag blue">{activeDeliveries.length} Active</span>
          </div>

          {activeDeliveries.length === 0 ? (
            <div className="rider-empty-box">
              <div className="empty-icon-circle blue">
                <Truck size={32} />
              </div>
              <h4>No Active Deliveries Right Now</h4>
              <p>Check the Available tab to grab orders waiting in your area.</p>
              <button className="primary-cta-btn" onClick={() => setActiveTab('available')}>
                <Zap size={15} /> View Available Orders
              </button>
            </div>
          ) : (
            <div className="active-deliveries-stack">
              {activeDeliveries.map((order) => {
                const currentStep = getStepNumber(order.status);
                const phone = order.whatsappNumber || order.guestPhone || '';

                return (
                  <div key={order._id} className="active-delivery-card glass-card">
                    {/* Header */}
                    <div className="active-card-header">
                      <div>
                        <span className="order-chip">Order #{order._id?.slice(-6).toUpperCase()}</span>
                        <h3 className="restaurant-heading">{order.restaurantName || 'Partner Restaurant'}</h3>
                      </div>
                      <div className="status-badge-pill">{order.status?.replace(/-/g, ' ')}</div>
                    </div>

                    {/* Step Timeline Progress */}
                    <div className="step-tracker-container">
                      <div className="tracker-bar">
                        <div
                          className="tracker-fill"
                          style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                        ></div>
                      </div>
                      <div className="tracker-nodes">
                        <div className={`step-node ${currentStep >= 1 ? 'completed' : ''}`}>
                          <div className="node-num">1</div>
                          <span>Assigned</span>
                        </div>
                        <div className={`step-node ${currentStep >= 2 ? 'completed' : ''}`}>
                          <div className="node-num">2</div>
                          <span>On Delivery</span>
                        </div>
                        <div className={`step-node ${currentStep >= 3 ? 'completed' : ''}`}>
                          <div className="node-num">3</div>
                          <span>Delivered</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="delivery-details-grid">
                      <div className="detail-item">
                        <label>Customer</label>
                        <p className="detail-val">{order.customerName || 'Customer'}</p>
                      </div>

                      <div className="detail-item">
                        <label>Delivery Address</label>
                        <p className="detail-val address">
                          <MapPin size={14} className="pin-icon" />
                          {order.deliveryAddress}
                        </p>
                      </div>

                      <div className="detail-item">
                        <label>Rider Earnings</label>
                        <strong className="detail-val earnings-highlight">
                          +KES {order.deliveryFee || 20}
                        </strong>
                      </div>

                      {order.specialInstructions && (
                        <div className="detail-item full-width">
                          <label>Special Instructions</label>
                          <p className="instructions-box">"{order.specialInstructions}"</p>
                        </div>
                      )}
                    </div>

                    {/* One-Tap Quick Contact Bar */}
                    <div className="quick-contact-actions">
                      {phone && (
                        <>
                          <a href={`tel:${phone}`} className="action-pill call">
                            <Phone size={13} /> Call
                          </a>
                          <a
                            href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="action-pill whatsapp"
                          >
                            <MessageCircle size={13} /> WhatsApp
                          </a>
                        </>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          order.deliveryAddress
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="action-pill maps"
                      >
                        <Navigation size={13} /> GPS Navigation
                      </a>
                    </div>

                    {/* Action Step Buttons */}
                    <div className="active-card-footer">
                      <button
                        className="details-link-btn"
                        onClick={() => navigate(`/rider/orders/${order._id}`)}
                      >
                        Details <ChevronRight size={14} />
                      </button>

                      {order.status === 'assigned' ||
                      order.status === 'preparing' ||
                      order.status === 'confirmed' ? (
                        <button
                          className="start-delivery-btn"
                          onClick={() => handleUpdateOrderStatus(order, 'out-for-delivery')}
                          disabled={actionLoadingId === order._id}
                        >
                          <Truck size={16} />
                          <span>{actionLoadingId === order._id ? 'Updating...' : 'Start Delivery'}</span>
                        </button>
                      ) : (
                        <button
                          className="complete-delivery-btn"
                          onClick={() => handleUpdateOrderStatus(order, 'delivered')}
                          disabled={actionLoadingId === order._id}
                        >
                          <CheckCircle2 size={16} />
                          <span>{actionLoadingId === order._id ? 'Completing...' : 'Mark as Delivered'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: HISTORY & EARNINGS ================= */}
      {activeTab === 'history' && (
        <div className="tab-pane-content">
          <div className="feed-header-row">
            <div className="feed-title-block">
              <h3>Delivery History</h3>
              <p>Track all completed orders and earnings breakdown</p>
            </div>
            <button className="wallet-link-btn" onClick={() => navigate('/rider/earnings')}>
              <DollarSign size={13} /> Wallet & Withdraw
            </button>
          </div>

          <div className="history-summary-ribbon">
            <div className="ribbon-card">
              <span className="ribbon-label">Total Earned</span>
              <strong>KES {totalEarningsCalculated.toLocaleString()}</strong>
            </div>
            <div className="ribbon-card">
              <span className="ribbon-label">Completed</span>
              <strong>{completedDeliveries.length} orders</strong>
            </div>
            <div className="ribbon-card">
              <span className="ribbon-label">Avg. / Delivery</span>
              <strong>
                KES{' '}
                {completedDeliveries.length > 0
                  ? (totalEarningsCalculated / completedDeliveries.length).toFixed(0)
                  : '0'}
              </strong>
            </div>
          </div>

          {completedDeliveries.length === 0 ? (
            <div className="rider-empty-box">
              <p>No completed deliveries yet.</p>
            </div>
          ) : (
            <div className="completed-deliveries-list">
              {completedDeliveries.map((order) => (
                <div key={order._id} className="history-item-row glass-card">
                  <div className="history-item-left">
                    <div className="check-badge">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <h4>Order #{order._id?.slice(-6).toUpperCase()}</h4>
                      <p className="history-sub">
                        {order.customerName} • {formatCompactAddress(order.deliveryAddress)}
                      </p>
                      <span className="timestamp">
                        {order.deliveryCompletedAt
                          ? new Date(order.deliveryCompletedAt).toLocaleString()
                          : new Date(order.updatedAt || order.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="history-item-right">
                    <span className="earned-fee-badge">+KES {order.deliveryFee || 20}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: PROFILE ================= */}
      {activeTab === 'profile' && (
        <div className="tab-pane-content">
          <div className="feed-header-row">
            <div className="feed-title-block">
              <h3>Rider Partner Profile</h3>
              <p>Your account information and duty status</p>
            </div>
          </div>

          <div className="profile-details-card glass-card">
            <div className="profile-hero-row">
              <div className="profile-avatar-large">
                {profile?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'R'}
              </div>
              <div className="profile-hero-info">
                <h3>{profile?.name || user?.name || 'Rider'}</h3>
                <p>{profile?.email || user?.email}</p>
                <div className="rating-pill">⭐ 4.9 Partner Rating</div>
              </div>
            </div>

            <div className="profile-fields-grid">
              <div className="profile-field-box">
                <label>Phone Number</label>
                <p>{profile?.phone || 'Not provided'}</p>
              </div>

              <div className="profile-field-box">
                <label>Role</label>
                <p>Delivo Delivery Partner</p>
              </div>

              <div className="profile-field-box">
                <label>Duty Status</label>
                <div className="profile-status-action-row">
                  <p className="status-highlight">{profile?.riderStatus || 'available'}</p>
                  <button
                    className="profile-toggle-duty-btn"
                    onClick={promptToggleStatus}
                    disabled={profile?.riderStatus === 'on-delivery'}
                  >
                    {profile?.riderStatus === 'offline' ? 'Switch Online' : 'Switch Offline'}
                  </button>
                </div>
              </div>

              <div className="profile-field-box">
                <label>Completed Deliveries</label>
                <p>{completedDeliveries.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRMATION MODAL: GO ONLINE / OFFLINE ================= */}
      {statusModalOpen && (
        <div className="status-modal-backdrop" onClick={() => !statusSubmitting && setStatusModalOpen(false)}>
          <div className="status-modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="status-modal-close"
              onClick={() => !statusSubmitting && setStatusModalOpen(false)}
            >
              <X size={18} />
            </button>

            <div className="status-modal-icon-circle">
              {profile?.riderStatus === 'offline' ? (
                <div className="modal-icon-online">
                  <Radio size={28} />
                </div>
              ) : (
                <div className="modal-icon-offline">
                  <Power size={28} />
                </div>
              )}
            </div>

            <h3>
              {profile?.riderStatus === 'offline'
                ? 'Go Online & Start Delivering?'
                : 'Go Offline & Take a Break?'}
            </h3>

            <p className="status-modal-desc">
              {profile?.riderStatus === 'offline'
                ? 'You will become visible on the delivery network and start receiving nearby customer orders.'
                : 'You will stop receiving new customer delivery offers until you turn your status back online.'}
            </p>

            <div className="status-modal-actions">
              <button
                className="modal-cancel-btn"
                onClick={() => setStatusModalOpen(false)}
                disabled={statusSubmitting}
              >
                Cancel
              </button>

              <button
                className={`modal-confirm-btn ${
                  profile?.riderStatus === 'offline' ? 'btn-go-online' : 'btn-go-offline'
                }`}
                onClick={confirmToggleStatus}
                disabled={statusSubmitting}
              >
                {statusSubmitting ? (
                  <>
                    <RefreshCcw size={15} className="spinning" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    {profile?.riderStatus === 'offline' ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Yes, Go Online</span>
                      </>
                    ) : (
                      <>
                        <Power size={16} />
                        <span>Yes, Go Offline</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;
