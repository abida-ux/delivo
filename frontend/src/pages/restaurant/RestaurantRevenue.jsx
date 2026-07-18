import {useEffect, useState} from 'react';
import './RestaurantDashboard.css';

const RestaurantRevenue = () => {
  const [revenue, setRevenue] = useState({ totalRevenue: 0, availableBalance: 0, pendingBalance: 0, withdrawnBalance: 0 });
  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/restaurant/revenue', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setRevenue(json?.data || { totalRevenue: 0, availableBalance: 0, pendingBalance: 0, withdrawnBalance: 0 });
    };
    load();
  }, []);

  return (
    <div className="restaurant-shell">
      <div className="restaurant-header glass-card"><div><h1>Revenue</h1><p>Track earnings and balances</p></div></div>
      <div className="stats-grid">
        {[
          { label: 'Total Revenue', value: `KES ${Number(revenue.totalRevenue || 0).toLocaleString()}` },
          { label: 'Available Balance', value: `KES ${Number(revenue.availableBalance || 0).toLocaleString()}` },
          { label: 'Pending Balance', value: `KES ${Number(revenue.pendingBalance || 0).toLocaleString()}` },
          { label: 'Withdrawn Balance', value: `KES ${Number(revenue.withdrawnBalance || 0).toLocaleString()}` },
        ].map((card) => <div key={card.label} className="stat-card glass-card"><div className="stat-content"><p>{card.label}</p><h3>{card.value}</h3></div></div>)}
      </div>
    </div>
  );
};

export default RestaurantRevenue;
