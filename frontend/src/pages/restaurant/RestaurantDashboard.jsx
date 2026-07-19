import {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, ShoppingBag, Wallet, DollarSign, PackageOpen, ArrowRight } from 'lucide-react';
import '../pages.css';
import './RestaurantDashboard.css';

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    availableBalance: 0,
    withdrawnAmount: 0,
    totalFoodsSold: 0,
  });
  const [restaurant, setRestaurant] = useState({ name: 'Restaurant Portal', status: 'approved' });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/restaurant/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json?.success) {
          setStats(json.data.stats);
          setRestaurant(json.data.restaurant);
        }
      } catch (error) {
        console.error('Restaurant dashboard load failed', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const cards = [
    { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingBag },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: PackageOpen },
    { label: 'Completed Orders', value: stats.completedOrders, icon: BarChart3 },
    { label: "Today's Revenue", value: `KES ${stats.todayRevenue.toLocaleString()}`, icon: DollarSign },
    { label: 'Total Revenue', value: `KES ${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp },
    { label: 'Available Balance', value: `KES ${stats.availableBalance.toLocaleString()}`, icon: Wallet },
  ];

  const quickLinks = [
    { label: 'Orders', desc: 'Track orders and status', path: '/restaurant/orders' },
    { label: 'Completed', desc: 'Review delivered orders', path: '/restaurant/completed-orders' },
    { label: 'Foods', desc: 'Manage menu items', path: '/restaurant/foods' },
    { label: 'Revenue', desc: 'View earnings and reports', path: '/restaurant/revenue' },
    { label: 'Withdrawals', desc: 'Submit payout requests', path: '/restaurant/withdrawals' },
    { label: 'Profile', desc: 'Update restaurant info', path: '/restaurant/profile' },
  ];

  return (
    <div className="restaurant-shell">
      <div className="restaurant-header glass-card">
        <div>
          <h1>{restaurant.name}</h1>
          <p>Premium partner dashboard for restaurant operations</p>
        </div>
        <div className="restaurant-badge">{restaurant.status === 'approved' ? 'Partner Active' : 'Pending Review'}</div>
      </div>

      <div className="stats-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="stat-card" key={card.label}>
              <div className="stat-icon">
                <Icon size={22} />
              </div>
              <div className="stat-content">
                <p>{card.label}</p>
                <h3>{loading ? '—' : card.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="content-grid">
        <div className="panel glass-card">
          <div className="panel-title">
            <h2>Quick Access</h2>
          </div>
          <div className="nav-grid">
            {quickLinks.map((item) => (
              <button key={item.label} className="nav-card" onClick={() => navigate(item.path)}>
                <h3>{item.label}</h3>
                <p>{item.desc}</p>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}><ArrowRight size={16} /></div>
              </button>
            ))}
          </div>
        </div>
        <div className="panel glass-card">
          <div className="panel-title">
            <h2>At a glance</h2>
          </div>
          <div className="empty-state">
            <p>Restaurant orders, withdrawals, and earnings are now available in dedicated sections.</p>
            <p style={{ marginTop: 8 }}><strong>Foods sold:</strong> {stats.totalFoodsSold}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
