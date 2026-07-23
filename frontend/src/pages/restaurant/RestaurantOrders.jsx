import {useEffect, useState} from 'react';
import './RestaurantDashboard.css';

const RestaurantOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/restaurant/orders', { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        setOrders(json?.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  if (loading) return <div className="restaurant-shell"><div className="glass-card panel">Loading orders…</div></div>;

  return (
    <div className="restaurant-shell">
      <div className="restaurant-header glass-card">
        <div><h1>Orders</h1><p>Restaurant-specific order management</p></div>
      </div>
      <div className="panel glass-card">
        {orders.length === 0 ? <div className="empty-state">No orders found for this restaurant yet.</div> : <table className="table"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Rider</th><th>Payment</th><th>Total</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id} className="table-row"><td>{order._id?.slice(-6).toUpperCase()}</td><td>{order.customerName || order.userId?.name || 'Guest'}</td><td>{order.status}</td><td>{order.riderId ? `${order.riderId.name || 'Rider'}${order.riderId.phone ? ` • ${order.riderId.phone}` : ''}` : 'Unassigned'}</td><td>{order.paymentStatus}</td><td>KES {Number(order.totalPrice || 0).toLocaleString()}</td></tr>)}</tbody></table>}
      </div>
    </div>
  );
};

export default RestaurantOrders;
