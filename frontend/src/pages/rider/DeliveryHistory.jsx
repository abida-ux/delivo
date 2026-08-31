import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, MapPin, Calendar, RefreshCw, DollarSign, Package } from 'lucide-react';
import { getAPIUrl } from '../../services/api';
import '../pages.css';
import './DeliveryHistory.css';

const DeliveryHistory = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('all');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = getAPIUrl();
      const res = await fetch(`${apiUrl}/orders/rider/assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.success) {
        setDeliveries(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching rider delivery history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const completed = deliveries.filter((d) => d.status === 'delivered');
  const totalEarnings = completed.reduce((sum, d) => sum + (Number(d.deliveryFee) || 0), 0);

  const filteredDeliveries = completed.filter((d) => {
    if (filterDate === 'all') return true;
    const orderDate = new Date(d.deliveryCompletedAt || d.updatedAt || d.createdAt).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    if (filterDate === 'today') return orderDate === today;
    return true;
  });

  return (
    <div className="delivery-history">
      <div className="page-header">
        <div>
          <h1>Delivery History</h1>
          <p>Track all your completed orders and lifetime delivery earnings</p>
        </div>
        <button className="refresh-btn" onClick={fetchHistory} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="history-stats-grid">
        <div className="history-stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="stat-label">Delivered Orders</span>
            <h3>{completed.length}</h3>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="stat-icon orange">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="stat-label">Total Earned</span>
            <h3>KSh {totalEarnings.toLocaleString()}</h3>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="stat-icon blue">
            <Calendar size={22} />
          </div>
          <div>
            <span className="stat-label">Avg. Earning / Order</span>
            <h3>KSh {completed.length > 0 ? (totalEarnings / completed.length).toFixed(0) : '0'}</h3>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="history-filter-bar">
        <button
          className={`filter-btn ${filterDate === 'all' ? 'active' : ''}`}
          onClick={() => setFilterDate('all')}
        >
          All Time ({completed.length})
        </button>
        <button
          className={`filter-btn ${filterDate === 'today' ? 'active' : ''}`}
          onClick={() => setFilterDate('today')}
        >
          Today
        </button>
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="loading-state">
          <RefreshCw size={24} className="spinning" />
          <p>Loading delivery history...</p>
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="empty-history-card">
          <Package size={40} className="empty-icon" />
          <h3>No completed deliveries found</h3>
          <p>Deliveries you complete will appear here with full earnings breakdown.</p>
        </div>
      ) : (
        <div className="history-list">
          {filteredDeliveries.map((order) => (
            <div key={order._id} className="history-card">
              <div className="history-card-header">
                <div>
                  <span className="order-tag">#{order._id?.slice(-6).toUpperCase()}</span>
                  <h4 className="restaurant-title">{order.restaurantName || 'Delivo Restaurant'}</h4>
                </div>
                <div className="payout-badge">
                  +KSh {order.deliveryFee || 20} Earned
                </div>
              </div>

              <div className="history-meta-row">
                <div className="meta-item">
                  <MapPin size={14} className="meta-icon" />
                  <span>{order.deliveryAddress}</span>
                </div>
                <div className="meta-item">
                  <Clock size={14} className="meta-icon" />
                  <span>
                    {order.deliveryCompletedAt
                      ? new Date(order.deliveryCompletedAt).toLocaleString()
                      : new Date(order.updatedAt || order.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="history-card-footer">
                <span className="customer-name">Customer: {order.customerName || 'Customer'}</span>
                <span className="order-total">Order Total: KSh {order.totalPrice}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryHistory;
