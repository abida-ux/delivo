import React, { useEffect, useState } from 'react';
import './RestaurantDashboard.css';

const RestaurantCompletedOrders = () => {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/restaurant/completed', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setOrders(json?.data || []);
    };
    load();
  }, []);

  return (
    <div className="restaurant-shell">
      <div className="restaurant-header glass-card"><div><h1>Completed Orders</h1><p>Delivered orders for your restaurant</p></div></div>
      <div className="panel glass-card">{orders.length === 0 ? <div className="empty-state">No completed orders yet.</div> : <table className="table"><thead><tr><th>Customer</th><th>Status</th><th>Total</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id} className="table-row"><td>{order.customerName || order.userId?.name || 'Guest'}</td><td>{order.status}</td><td>KES {Number(order.totalPrice || 0).toLocaleString()}</td></tr>)}</tbody></table>}</div>
    </div>
  );
};

export default RestaurantCompletedOrders;
