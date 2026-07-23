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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext as AuthContextValue } from '../../context/AuthContext.jsx';
import { getOrderById, updateOrder, getUnassignedOrders, claimOrder } from '../../services/api';
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
  const shownNotificationIds = useRef(new Set());

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 4000);
  };

  const fetchDashboardData = async (isSilent = false) => {
    if (!user?._id && !user?.id) return;
    try {
      if (!isSilent) setLoading(true);
      const [profileRes, assignedRes, unassignedData] = await Promise.all([
        fetch(`/api/users/me`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json()),
        fetch(`/api/orders/rider/assigned`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json()),
        getUnassignedOrders().catch(() => []),
      ]);

      if (profileRes?.success) {
        const normalizedProfile = {
          ...profileRes.data,
          riderStatus: profileRes.data?.riderStatus === 'on-delivery' ? 'on-delivery' : profileRes.data?.riderStatus || 'available',
        };
        setProfile(normalizedProfile);
      }

      if (assignedRes?.success) {
        const ordersList = assignedRes.data || [];
        setAssignedOrders(ordersList);
      }

      setUnassignedOrders(unassignedData || []);
    } catch (error) {
      console.error('Failed to load rider dashboard data', error);
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
        const response = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        const assignmentNotification = (data?.notifications || []).find((notification) => {
          if (notification?.isRead) return false;
          const title = String(notification?.title || '').toLowerCase();
          const message = String(notification?.message || '').toLowerCase();
          return title.includes('delivery') || title.includes('assigned') || message.includes('assigned') || message.includes('delivery');
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
    return assignedOrders.filter((order) => ['assigned', 'out-for-delivery', 'on-delivery', 'preparing', 'confirmed'].includes(order.status));
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
    } catch (error) {
      console.error('Grab order failed', error);
      showToast(error?.response?.data?.message || 'Order already claimed or unavailable.', 'error');
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
          showToast('Delivery completed successfully!');
        }
        await fetchDashboardData(true);
      }
    } catch (error) {
      console.error('Status update failed', error);
      showToast('Failed to update status. Please try again.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleOnlineStatus = async () => {
    try {
      const newStatus = profile?.riderStatus === 'offline' ? 'available' : 'offline';
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ riderStatus: newStatus }),
      });
      const data = await res.json();
      if (data?.success || res.ok) {
        setProfile((prev) => ({ ...prev, riderStatus: newStatus }));
        showToast(`Status updated to ${newStatus.toUpperCase()}`);
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
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

  return (
    <div className="sick-rider-dashboard">
      {/* Dynamic Modern Header Banner */}
      <div className="rider-hero-card">
        <div className="hero-glow-overlay"></div>
        <div className="hero-content">
          <div className="hero-user-info">
            <div className="rider-avatar-badge">
              <span>{profile?.name?.charAt(0).toUpperCase() || 'R'}</span>
              <div className={`status-dot ${profile?.riderStatus === 'on-delivery' ? 'busy' : profile?.riderStatus === 'offline' ? 'offline' : 'online'}`} />
            </div>
            <div>
              <div className="rider-title-row">
                <h1>{profile?.name || user?.name || 'Delivo Rider'}</h1>
                <span className="pro-pill"><ShieldCheck size={14} /> Delivery Partner</span>
              </div>
              <p className="hero-subtitle">
                {profile?.riderStatus === 'on-delivery'
                  ? 'Active Delivery in Progress'
                  : profile?.riderStatus === 'offline'
                  ? 'Offline - Go online to receive orders'
                  : 'Online & Ready for Deliveries'}
              </p>
            </div>
          </div>

          <div className="hero-actions">
            <button className="icon-refresh-btn" onClick={() => fetchDashboardData()} title="Refresh Orders">
              <RefreshCcw size={18} className={loading ? 'spinning' : ''} />
            </button>
            <button
              className={`online-toggle-btn ${profile?.riderStatus === 'offline' ? 'is-offline' : profile?.riderStatus === 'on-delivery' ? 'is-busy' : 'is-online'}`}
              onClick={handleToggleOnlineStatus}
              disabled={profile?.riderStatus === 'on-delivery'}
            >
              <div className="toggle-indicator"></div>
              <span>{profile?.riderStatus === 'on-delivery' ? 'On Duty' : profile?.riderStatus === 'offline' ? 'Go Online' : 'Online'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="sick-stats-grid">
          <div className="sick-stat-card orange-card">
            <div className="stat-icon-wrapper orange-icon">
              <Zap size={22} />
            </div>
            <div>
              <span className="stat-label">Available to Grab</span>
              <div className="stat-value">{unassignedOrders.length}</div>
            </div>
          </div>

          <div className="sick-stat-card slate-card">
            <div className="stat-icon-wrapper slate-icon">
              <Truck size={22} />
            </div>
            <div>
              <span className="stat-label">Active Orders</span>
              <div className="stat-value">{activeDeliveries.length}</div>
            </div>
          </div>

          <div className="sick-stat-card green-card">
            <div className="stat-icon-wrapper green-icon">
              <Clock size={22} />
            </div>
            <div>
              <span className="stat-label">Delivered Today</span>
              <div className="stat-value">{todayCompletedCount}</div>
            </div>
          </div>

          <div className="sick-stat-card green-card">
            <div className="stat-icon-wrapper green-icon">
              <DollarSign size={22} />
            </div>
            <div>
              <span className="stat-label">Total Earnings</span>
              <div className="stat-value">KES {totalEarningsCalculated.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications / Toast Alerts */}
      {toastMessage.text && (
        <div className={`sick-toast ${toastMessage.type}`}>
          <Sparkles size={18} />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {notificationToast && (
        <div className="sick-toast push-alert">
          <div className="toast-left">
            <Zap size={20} className="pulse-icon" />
            <div>
              <strong>{notificationToast.title}</strong>
              <p>{notificationToast.message}</p>
            </div>
          </div>
          <button className="dismiss-toast-btn" onClick={() => setNotificationToast(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Modern Navigation Tabs */}
      <div className="rider-tabs-header">
        <button className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`} onClick={() => setActiveTab('available')}>
          <Zap size={18} />
          <span>Available Orders</span>
          {unassignedOrders.length > 0 && <span className="tab-badge orange-badge">{unassignedOrders.length}</span>}
        </button>

        <button className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
          <Truck size={18} />
          <span>Active Delivery</span>
          {activeDeliveries.length > 0 && <span className="tab-badge slate-badge">{activeDeliveries.length}</span>}
        </button>

        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <History size={18} />
          <span>History & Earnings</span>
        </button>

        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <UserIcon size={18} />
          <span>My Profile</span>
        </button>
      </div>

      {/* Tab 1: Available Orders to Grab */}
      {activeTab === 'available' && (
        <div className="tab-pane">
          <div className="pane-title-row">
            <h2>
              <Zap size={22} className="orange-text" /> Available Orders Ready to Grab
            </h2>
            <span className="live-tag">
              <span className="pulse-green-dot"></span> Live Feed
            </span>
          </div>

          {loading ? (
            <div className="sick-loading-card">
              <div className="sick-spinner"></div>
              <p>Scanning area for new delivery orders...</p>
            </div>
          ) : unassignedOrders.length === 0 ? (
            <div className="sick-empty-card">
              <div className="empty-icon-circle">
                <Package size={36} />
              </div>
              <h3>No Unassigned Orders Right Now</h3>
              <p>Check back in a moment! New orders appear as customers place them.</p>
              <button className="sick-sec-btn" onClick={() => fetchDashboardData()}>
                <RefreshCcw size={16} /> Refresh Feed
              </button>
            </div>
          ) : (
            <div className="available-orders-grid">
              {unassignedOrders.map((order) => (
                <div key={order._id} className="sick-grab-card">
                  <div className="grab-card-header">
                    <div className="order-id-badge">#{order._id?.slice(-6).toUpperCase()}</div>
                    <div className="earning-tag">
                      <DollarSign size={14} /> +KES {order.deliveryFee || 20} Earnings
                    </div>
                  </div>

                  <div className="grab-details-body">
                    <div className="detail-row">
                      <span className="detail-label">Restaurant</span>
                      <strong className="detail-value">{order.restaurantName || 'Delivo Partner Restaurant'}</strong>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Delivery Destination</span>
                      <p className="address-p">
                        <MapPin size={15} className="orange-text" style={{ flexShrink: 0 }} />
                        {order.deliveryAddress}
                      </p>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Customer</span>
                      <span className="detail-value">{order.customerName || 'Customer'}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Order Items</span>
                      <span className="items-summary">
                        {(order.items || []).map((it) => `${it.quantity}x ${it.foodId?.name || 'Item'}`).join(', ') || 'Food items'}
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Order Total</span>
                      <span className="price-tag">KES {order.totalPrice}</span>
                    </div>
                  </div>

                  <div className="grab-card-footer">
                    <button
                      className="sick-grab-btn"
                      onClick={() => handleGrabOrder(order._id)}
                      disabled={actionLoadingId === order._id || profile?.riderStatus === 'offline'}
                    >
                      {actionLoadingId === order._id ? (
                        'Accepting Order...'
                      ) : (
                        <>
                          <span>Grab Order Now</span> <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Active Delivery */}
      {activeTab === 'active' && (
        <div className="tab-pane">
          <div className="pane-title-row">
            <h2>
              <Truck size={22} className="orange-text" /> Active Delivery Tracker
            </h2>
            <span className="count-pill">{activeDeliveries.length} Active</span>
          </div>

          {activeDeliveries.length === 0 ? (
            <div className="sick-empty-card">
              <div className="empty-icon-circle">
                <Truck size={36} />
              </div>
              <h3>No Active Delivery Right Now</h3>
              <p>Switch to the "Available Orders" tab to grab a new delivery!</p>
              <button className="sick-pri-btn" onClick={() => setActiveTab('available')}>
                <Zap size={16} /> View Available Orders
              </button>
            </div>
          ) : (
            <div className="active-deliveries-list">
              {activeDeliveries.map((order) => {
                const currentStep = getStepNumber(order.status);
                const phone = order.whatsappNumber || order.guestPhone || '';

                return (
                  <div key={order._id} className="sick-active-card">
                    {/* Header */}
                    <div className="active-card-top">
                      <div>
                        <span className="order-chip">Order #{order._id?.slice(-6).toUpperCase()}</span>
                        <h3 className="active-restaurant">{order.restaurantName || 'Partner Restaurant'}</h3>
                      </div>
                      <div className="status-pill-badge">{order.status?.replace(/-/g, ' ')}</div>
                    </div>

                    {/* Step Timeline */}
                    <div className="step-timeline-container">
                      <div className="timeline-track">
                        <div className="timeline-progress" style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>
                      </div>
                      <div className="step-nodes">
                        <div className={`step-node ${currentStep >= 1 ? 'completed' : ''}`}>
                          <div className="node-icon">1</div>
                          <span>Assigned</span>
                        </div>
                        <div className={`step-node ${currentStep >= 2 ? 'completed' : ''}`}>
                          <div className="node-icon">2</div>
                          <span>Out for Delivery</span>
                        </div>
                        <div className={`step-node ${currentStep >= 3 ? 'completed' : ''}`}>
                          <div className="node-icon">3</div>
                          <span>Delivered</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer & Address Details Grid */}
                    <div className="active-info-box">
                      <div className="info-column">
                        <label>Customer Name</label>
                        <p>{order.customerName || 'Customer'}</p>
                      </div>

                      <div className="info-column">
                        <label>Delivery Address</label>
                        <p className="address-p">
                          <MapPin size={16} className="orange-text" />
                          {order.deliveryAddress}
                        </p>
                      </div>

                      <div className="info-column">
                        <label>Order Amount</label>
                        <p className="bold-price">KES {order.totalPrice}</p>
                      </div>

                      {order.specialInstructions && (
                        <div className="info-column full-width">
                          <label>Special Instructions</label>
                          <p className="instructions-p">"{order.specialInstructions}"</p>
                        </div>
                      )}
                    </div>

                    {/* Quick Contact Actions Bar */}
                    <div className="contact-actions-bar">
                      {phone && (
                        <>
                          <a href={`tel:${phone}`} className="contact-chip call">
                            <Phone size={15} /> Call ({phone})
                          </a>
                          <a
                            href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="contact-chip whatsapp"
                          >
                            <MessageCircle size={15} /> WhatsApp
                          </a>
                        </>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="contact-chip maps"
                      >
                        <Navigation size={15} /> Open Navigation
                      </a>
                    </div>

                    {/* Status Action Buttons */}
                    <div className="active-card-actions">
                      <button className="sick-sec-btn" onClick={() => navigate(`/rider/orders/${order._id}`)}>
                        Full Details <ChevronRight size={16} />
                      </button>

                      {order.status === 'assigned' || order.status === 'preparing' || order.status === 'confirmed' ? (
                        <button
                          className="sick-pri-btn"
                          onClick={() => handleUpdateOrderStatus(order, 'out-for-delivery')}
                          disabled={actionLoadingId === order._id}
                        >
                          <Truck size={18} /> {actionLoadingId === order._id ? 'Updating...' : 'Start Delivery'}
                        </button>
                      ) : (
                        <button
                          className="sick-success-btn"
                          onClick={() => handleUpdateOrderStatus(order, 'delivered')}
                          disabled={actionLoadingId === order._id}
                        >
                          <CheckCircle2 size={18} /> {actionLoadingId === order._id ? 'Completing...' : 'Mark as Delivered'}
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

      {/* Tab 3: History & Earnings */}
      {activeTab === 'history' && (
        <div className="tab-pane">
          <div className="pane-title-row">
            <h2>
              <History size={22} className="orange-text" /> Completed Deliveries & Earnings
            </h2>
            <span className="count-pill">{completedDeliveries.length} Total</span>
          </div>

          <div className="history-summary-cards">
            <div className="summary-card">
              <span className="sum-label">Total Earnings</span>
              <h3 className="sum-val">KES {totalEarningsCalculated.toLocaleString()}</h3>
            </div>
            <div className="summary-card">
              <span className="sum-label">Total Completed</span>
              <h3 className="sum-val">{completedDeliveries.length} Deliveries</h3>
            </div>
            <div className="summary-card">
              <span className="sum-label">Avg. per Delivery</span>
              <h3 className="sum-val">
                KES {completedDeliveries.length > 0 ? (totalEarningsCalculated / completedDeliveries.length).toFixed(0) : '0'}
              </h3>
            </div>
          </div>

          {completedDeliveries.length === 0 ? (
            <div className="sick-empty-card">
              <p>No completed deliveries yet.</p>
            </div>
          ) : (
            <div className="completed-list">
              {completedDeliveries.map((order) => (
                <div key={order._id} className="history-item-card">
                  <div className="history-item-left">
                    <div className="check-icon-circle">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4>Order #{order._id?.slice(-6).toUpperCase()}</h4>
                      <p className="meta-text">{order.customerName} • {order.deliveryAddress}</p>
                      <span className="time-text">
                        {order.deliveryCompletedAt
                          ? new Date(order.deliveryCompletedAt).toLocaleString()
                          : new Date(order.updatedAt || order.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="history-item-right">
                    <span className="earned-badge">+KES {order.deliveryFee || 20} Fee</span>
                    <span className="total-amount-text">Total: KES {order.totalPrice}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Profile */}
      {activeTab === 'profile' && (
        <div className="tab-pane">
          <div className="pane-title-row">
            <h2>
              <UserIcon size={22} className="orange-text" /> Rider Partner Profile
            </h2>
          </div>

          <div className="profile-glass-card">
            <div className="profile-header-meta">
              <div className="profile-big-avatar">{profile?.name?.charAt(0) || 'R'}</div>
              <div>
                <h3>{profile?.name || user?.name || 'Rider'}</h3>
                <p>{profile?.email || user?.email}</p>
                <div className="rating-pill">⭐ 4.9 Rating • Delivo Partner</div>
              </div>
            </div>

            <div className="profile-info-grid">
              <div className="profile-field">
                <label>Phone Number</label>
                <p>{profile?.phone || 'Not provided'}</p>
              </div>

              <div className="profile-field">
                <label>Role</label>
                <p>Delivery Partner (Rider)</p>
              </div>

              <div className="profile-field">
                <label>Duty Status</label>
                <p className="status-highlight">{profile?.riderStatus || 'available'}</p>
              </div>

              <div className="profile-field">
                <label>Total Completed Deliveries</label>
                <p>{completedDeliveries.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;
