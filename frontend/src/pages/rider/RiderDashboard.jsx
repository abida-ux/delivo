import { useContext, useEffect, useMemo, useState } from 'react';
import { Clock, DollarSign, MapPin, RefreshCcw, Truck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext as AuthContextValue } from '../../context/AuthContext.jsx';
import { getOrderById, updateOrder, updateUser } from '../../services/api';
import '../pages.css';
import './RiderDashboard.css';

const RiderDashboard = () => {
  const navigate = useNavigate();
  const authContext = AuthContextValue ? useContext(AuthContextValue) : null;
  const user = authContext?.user ?? null;
  const token = authContext?.token ?? null;
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const fetchDashboardData = async () => {
    if (!user?._id && !user?.id) return;
    try {
      setLoading(true);
      const [profileRes, assignedRes] = await Promise.all([
        fetch(`/api/users/me`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json()),
        fetch(`/api/orders/rider/assigned`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json()),
      ]);
      if (profileRes?.success) setProfile(profileRes.data);
      if (assignedRes?.success) setOrders(assignedRes.data || []);
    } catch (error) {
      console.error('Failed to load rider dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token, user]);

  const stats = useMemo(() => [
    { label: 'Current Active Delivery', value: orders.filter((order) => ['assigned', 'out-for-delivery', 'on-delivery'].includes(order.status)).length, icon: Truck, color: '#3b82f6' },
    { label: 'Deliveries Today', value: orders.filter((order) => order.status === 'delivered' && new Date(order.updatedAt || order.createdAt).toDateString() === new Date().toDateString()).length, icon: Clock, color: '#22c55e' },
    { label: 'Total Deliveries', value: orders.filter((order) => order.status === 'delivered').length, icon: CheckCircle2, color: '#f59e0b' },
    { label: 'Earnings', value: `KES ${((profile?.totalEarnings || 0)).toFixed(0)}`, icon: DollarSign, color: '#8b5cf6' },
  ], [orders, profile]);

  const handleStatusToggle = async () => {
    if (!user?.id && !user?._id) return;
    setUpdating(true);
    try {
      const nextStatus = profile?.riderStatus === 'offline' ? 'available' : 'offline';
      const response = await fetch('/api/users/me/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ riderStatus: nextStatus }),
      });
      const data = await response.json();
      if (data?.success) {
        setProfile(data.data);
        setMessage(`Status updated to ${data.data.riderStatus}`);
      }
    } catch (error) {
      console.error('Failed to update rider status', error);
      setMessage('Unable to update rider status right now.');
    } finally {
      setUpdating(false);
    }
  };

  const handleOrderAction = async (order, action) => {
    try {
      setUpdating(true);
      if (action === 'start') {
        const response = await updateOrder(order._id, { status: 'out-for-delivery', riderId: order.riderId || user?.id || user?._id });
        if (response?.success) {
          setMessage('Delivery started');
          await fetchDashboardData();
        }
      } else if (action === 'complete') {
        const response = await updateOrder(order._id, { status: 'delivered', riderId: order.riderId || user?.id || user?._id });
        if (response?.success) {
          setMessage('Delivery completed');
          await fetchDashboardData();
        }
      } else {
        const response = await getOrderById(order._id);
        if (response) {
          navigate(`/rider/orders/${response._id}`);
        }
      }
    } catch (error) {
      console.error('Failed to update order', error);
      setMessage('Unable to update order right now.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="rider-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <div>
            <h1>{profile?.name || user?.name || 'Rider'}</h1>
            <p>Delivery Partner Dashboard</p>
          </div>
          <div className="status-toggle">
            <span className={profile?.riderStatus === 'available' ? 'online' : profile?.riderStatus === 'on-delivery' ? 'busy' : 'offline'}>
              {profile?.riderStatus === 'available' ? '🟢 Available' : profile?.riderStatus === 'on-delivery' ? '🟡 On Delivery' : '🔴 Offline'}
            </span>
            <button className="toggle-btn" onClick={handleStatusToggle} disabled={updating}>
              {updating ? 'Updating...' : profile?.riderStatus === 'offline' ? 'Go Online' : 'Go Offline'}
            </button>
          </div>
        </div>
      </div>

      {message ? <div className="rider-toast">{message}</div> : null}

      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <h3 className="stat-value">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="current-deliveries-section">
        <div className="section-header">
          <h2>Assigned Orders</h2>
          <span className="count">{orders.length}</span>
        </div>
        {loading ? <div className="loading-state">Loading assigned orders...</div> : orders.length === 0 ? (
          <div className="empty-state">No orders assigned yet.</div>
        ) : (
          <div className="deliveries-list">
            {orders.map((order) => (
              <div key={order._id} className="delivery-card">
                <div className="delivery-header">
                  <h3>#{(order._id || '').slice(-6).toUpperCase()}</h3>
                  <span className="badge active">{order.status || 'pending'}</span>
                </div>
                <div className="delivery-info">
                  <p><strong>Customer:</strong> {order.customerName || 'Customer'}</p>
                  <p><strong>Phone:</strong> {order.whatsappNumber || order.guestPhone || 'N/A'}</p>
                  <p><strong>Location:</strong> {order.deliveryAddress}</p>
                  <p><strong>Restaurant:</strong> {order.restaurantName || 'Restaurant'}</p>
                  <p><strong>Items:</strong> {(order.items || []).map((item) => `${item.quantity}x ${item.foodId?.name || 'Item'}`).join(', ')}</p>
                  <p><strong>Total:</strong> KES {order.totalPrice}</p>
                </div>
                <div className="delivery-actions">
                  <button className="details-btn" onClick={() => handleOrderAction(order, 'view')}>View Details</button>
                  <button className="details-btn" onClick={() => handleOrderAction(order, 'start')} disabled={updating}>Start Delivery</button>
                  <button className="details-btn" onClick={() => handleOrderAction(order, 'complete')} disabled={updating}>Complete Delivery</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="profile-section">
        <div className="section-header">
          <h2>Profile Information</h2>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <label>Email</label>
            <p>{profile?.email || user?.email || 'N/A'}</p>
          </div>
          <div className="info-item">
            <label>Phone</label>
            <p>{profile?.phone || 'N/A'}</p>
          </div>
          <div className="info-item">
            <label>Current Status</label>
            <p>{profile?.riderStatus || 'offline'}</p>
          </div>
          <div className="info-item">
            <label>Deliveries Completed</label>
            <p>{profile?.totalDeliveries || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
