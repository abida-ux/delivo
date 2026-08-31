import { useState, useEffect, useContext } from 'react';
import {
  Users,
  Store,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  UtensilsCrossed,
  DollarSign,
  BarChart3,
  Activity,
  ShoppingBasket,
  Clock,
  Layers,
  ChevronRight,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Play,
  Heart,
} from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { AuthContext } from '../../context/AuthContext';
import { getAdminStats, getAllOrders, getMarketplaceAdminOverview } from '../../services/api';

import { formatCurrency } from '../../utils/currency';
import '../pages.css';
import './AdminDashboard.css';

const getCurrentWeekWindow = () => {
  const start = new Date();
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { start, end };
};

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    users: 0,
    restaurants: 0,
    orders: 0,
    foods: 0,
    revenue: 0,
    averageOrderValue: 0,
    revenueChangePct: 0,
    ordersChangePct: 0,
    usersChangePct: 0,
    restaurantsChangePct: 0,
  });
  const [weeklyOrderTrend, setWeeklyOrderTrend] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [marketplaceOverview, setMarketplaceOverview] = useState({ categories: 0, products: 0, lowStockProducts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [data, marketplaceData, ordersRes] = await Promise.all([
        getAdminStats(),
        getMarketplaceAdminOverview(),
        getAllOrders(),
      ]);

      const orders = Array.isArray(ordersRes) ? ordersRes : ordersRes?.data || [];
      const { start, end } = getCurrentWeekWindow();
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const trendMap = days.reduce((acc, day) => {
        acc[day] = 0;
        return acc;
      }, {});

      const validOrders = orders.filter((order) => {
        const createdAt = order.createdAt ? new Date(order.createdAt) : null;
        if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
        if (String(order.status || '').toLowerCase() === 'cancelled') return false;
        if (Number(order.totalPrice || 0) < 40) return false;
        return createdAt >= start && createdAt < end;
      });

      validOrders.forEach((order) => {
        const createdAt = new Date(order.createdAt);
        const day = days[(createdAt.getDay() + 6) % 7];
        if (trendMap[day] !== undefined) {
          trendMap[day] += 1;
        }
      });

      const recentValidOrders = [...orders]
        .filter((order) => {
          const status = String(order.status || '').toLowerCase();
          return status !== 'cancelled' && Number(order.totalPrice || 0) >= 40;
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);

      setWeeklyOrderTrend(days.map((day) => ({ day, value: trendMap[day] })));
      setRecentOrders(recentValidOrders);

      if (data) {
        setStats({
          users: data.users || 0,
          restaurants: data.restaurants || 0,
          orders: data.orders || 0,
          foods: data.foods || 0,
          revenue: data.revenue || 0,
          averageOrderValue: data.averageOrderValue || 0,
          revenueChangePct: data.revenueChangePct || 0,
          ordersChangePct: data.ordersChangePct || 0,
          usersChangePct: data.usersChangePct || 0,
          restaurantsChangePct: data.restaurantsChangePct || 0,
        });
      }
      if (marketplaceData) {
        setMarketplaceOverview(marketplaceData);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };



  // Date and Greeting helpers
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const currentFormattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formatOrderId = (order) => {
    const id = order?._id || order?.id || '';
    return id ? `#${String(id).slice(-8)}` : '#n/a';
  };

  const getRestaurantName = (order) => {
    const restaurantFromArray = order?.restaurants?.find((entry) => entry?.name)?.name;
    if (restaurantFromArray) return restaurantFromArray;
    if (order?.restaurantName) return order.restaurantName;
    if (order?.items?.[0]?.restaurantName) return order.items[0].restaurantName;
    return 'Restaurant';
  };

  const getOrderBadgeClass = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'cancelled') return 'badge badge-danger';
    if (['delivered', 'completed'].includes(normalized)) return 'badge badge-success';
    if (['pending', 'confirmed', 'preparing', 'on-delivery', 'out-for-delivery', 'assigned'].includes(normalized)) return 'badge badge-warning';
    return 'badge badge-secondary';
  };

  const getStatusLabel = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'cancelled') return 'Cancelled';
    if (normalized === 'delivered') return 'Delivered';
    if (normalized === 'completed') return 'Completed';
    if (normalized === 'pending') return 'Pending';
    if (normalized === 'confirmed') return 'Confirmed';
    if (normalized === 'preparing') return 'Preparing';
    if (normalized === 'on-delivery' || normalized === 'out-for-delivery' || normalized === 'assigned') return 'In Transit';
    return status || 'Pending';
  };

  const formatRelativeTime = (dateValue) => {
    if (!dateValue) return 'Recently';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Recently';
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const statCards = [
    {
      label: 'Users',
      value: stats.users,
      icon: Users,
      color: '#16a34a',
      change: `${stats.usersChangePct >= 0 ? '+' : ''}${stats.usersChangePct}%`,
      isPositive: stats.usersChangePct >= 0,
      desc: 'Active customer registry'
    },
    {
      label: 'Restaurants',
      value: stats.restaurants,
      icon: Store,
      color: '#16a34a',
      change: `${stats.restaurantsChangePct >= 0 ? '+' : ''}${stats.restaurantsChangePct}%`,
      isPositive: stats.restaurantsChangePct >= 0,
      desc: 'Onboarded merchants'
    },
    {
      label: 'Orders',
      value: stats.orders,
      icon: ShoppingCart,
      color: '#16a34a',
      change: `${stats.ordersChangePct >= 0 ? '+' : ''}${stats.ordersChangePct}%`,
      isPositive: stats.ordersChangePct >= 0,
      desc: 'Total lifetime deliveries'
    },
    {
      label: 'Revenue',
      value: formatCurrency(stats.revenue),
      icon: DollarSign,
      color: '#22c55e',
      change: `${stats.revenueChangePct >= 0 ? '+' : ''}${stats.revenueChangePct}%`,
      isPositive: stats.revenueChangePct >= 0,
      desc: 'Gross marketplace revenue'
    },
    {
      label: 'Marketplace',
      value: marketplaceOverview.products || 0,
      icon: ShoppingBasket,
      color: '#16a34a',
      change: 'Live',
      isPositive: true,
      desc: 'Total active products'
    },
    {
      label: 'Menu Items',
      value: stats.foods,
      icon: UtensilsCrossed,
      color: '#16a34a',
      change: `${stats.averageOrderValue ? 'Avg' : '0%'}`,
      isPositive: true,
      desc: 'Available dishes listed'
    },
  ];

  return (
    <AdminDashboardLayout pageTitle="Dashboard">
      <div className="admin-dashboard-v2">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading premium metrics...</p>
          </div>
        ) : (
          <div className="dashboard-grid-container">
            {/* ── WELCOME BANNER SECTION ── */}
            <div className="welcome-banner">
              <div className="welcome-text">
                <h2>{greeting}, {user?.name || 'Abeda'} 👋</h2>
                <p>Here's what's happening across Delivo today.</p>
              </div>
              <div className="welcome-date">
                <Calendar size={14} />
                <span>{currentFormattedDate}</span>
              </div>
            </div>

            {/* ── FIRST ROW: Revenue & Orders Chart ── */}
            <div className="layout-row-one">
              <div className="large-kpi-card revenue-card">
                <div className="kpi-header">
                  <div className="kpi-title-block">
                    <span className="kpi-badge-label">Gross Revenue</span>
                    <h3>{formatCurrency(stats.revenue)}</h3>
                  </div>
                  <div className={`kpi-trend ${stats.revenueChangePct >= 0 ? 'positive' : 'negative'}`}>
                    {stats.revenueChangePct >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    <span>{stats.revenueChangePct >= 0 ? '+' : ''}{stats.revenueChangePct}%</span>
                  </div>
                </div>
                <div className="kpi-chart-preview">
                  {weeklyOrderTrend.length > 0 ? weeklyOrderTrend.map((day, index) => (
                    <div
                      key={`${day.day}-${index}`}
                      className="sparkline-bar"
                      style={{ height: `${Math.max((day.value / Math.max(...weeklyOrderTrend.map((item) => item.value), 1)) * 100, 8)}%` }}
                    />
                  )) : [1,2,3,4,5,6,7].map((item) => (
                    <div key={item} className="sparkline-bar" style={{ height: '8%' }} />
                  ))}
                </div>
                <p className="kpi-footer-text">Average order basket value is {formatCurrency(stats.averageOrderValue || 0)}</p>
              </div>

              <div className="large-kpi-card orders-chart-card">
                <div className="kpi-header">
                  <div className="kpi-title-block">
                    <span className="kpi-badge-label">Orders Trend</span>
                    <h3>{stats.orders} Total</h3>
                  </div>
                  <div className={`kpi-trend ${stats.ordersChangePct >= 0 ? 'positive' : 'negative'}`}>
                    {stats.ordersChangePct >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    <span>{stats.ordersChangePct >= 0 ? '+' : ''}{stats.ordersChangePct}%</span>
                  </div>
                </div>
                <div className="mini-bar-chart">
                  {weeklyOrderTrend.length > 0 ? weeklyOrderTrend.map((day, index) => (
                    <div key={`${day.day}-${index}`} className="chart-bar-col">
                      <div className="bar-fill" style={{ height: `${Math.max((day.value / Math.max(...weeklyOrderTrend.map((item) => item.value), 1)) * 100, 8)}%` }} />
                      <span className="bar-label">{day.day.slice(0, 3)}</span>
                    </div>
                  )) : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day) => (
                    <div key={day} className="chart-bar-col">
                      <div className="bar-fill" style={{ height: '8%' }} />
                      <span className="bar-label">{day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SECOND ROW: KPI Cards ── */}
            <div className="layout-row-two">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="v2-stat-card">
                    <div className="v2-stat-header">
                      <div className="v2-icon-box">
                        <Icon size={18} />
                      </div>
                      <div className={`v2-trend ${stat.isPositive ? 'positive' : 'negative'}`}>
                        {stat.change}
                      </div>
                    </div>
                    <div className="v2-stat-body">
                      <span className="v2-label">{stat.label}</span>
                      <h4 className="v2-value">{stat.value}</h4>
                    </div>
                    <p className="v2-desc">{stat.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* ── THIRD ROW: Recent Orders (Stripe-inspired Table) ── */}
            <div className="layout-row-three">
              <div className="large-table-card">
                <div className="table-card-header">
                  <div className="header-left">
                    <h3>Recent Transactions</h3>
                    <p>Live order stream dispatch logs</p>
                  </div>
                  <button className="table-view-all-btn">View All</button>
                </div>
                <div className="table-responsive">
                  <table className="stripe-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Restaurant</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.length > 0 ? recentOrders.map((order) => (
                        <tr key={order._id || order.id || `${order.createdAt}-${order.totalPrice}`}>
                          <td className="font-mono text-xs">{formatOrderId(order)}</td>
                          <td>{getRestaurantName(order)}</td>
                          <td className="font-semibold">{formatCurrency(Number(order.totalPrice || 0))}</td>
                          <td>
                            <span className={getOrderBadgeClass(order.status)}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td>{formatRelativeTime(order.createdAt)}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>
                            No valid recent orders available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── FOURTH ROW: Recent Activity, System Health, Latest Users ── */}
            <div className="layout-row-four">
              {/* Recent Activity */}
              <div className="widget-card">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-dot dot-orange" />
                    <div className="activity-content">
                      <p>New restaurant onboarded: <strong>Mama Oliech Kitchen</strong></p>
                      <span className="activity-time">2 hours ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-dot dot-green" />
                    <div className="activity-content">
                      <p>Rider <strong>John Doe</strong> logged online</p>
                      <span className="activity-time">3 hours ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-dot dot-blue" />
                    <div className="activity-content">
                      <p>Order <strong>#6a1aa</strong> delivered successfully</p>
                      <span className="activity-time">4 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="widget-card">
                <h3>System Health</h3>
                <div className="health-status-list">
                  <div className="health-row">
                    <div className="health-item-label">
                      <span className="status-indicator online"></span>
                      <span>App Server</span>
                    </div>
                    <span className="health-badge success">Operational</span>
                  </div>
                  <div className="health-row">
                    <div className="health-item-label">
                      <span className="status-indicator online"></span>
                      <span>MongoDB Database</span>
                    </div>
                    <span className="health-badge success">Connected</span>
                  </div>
                  <div className="health-row">
                    <div className="health-item-label">
                      <span className="status-indicator online"></span>
                      <span>Payment Gateway API</span>
                    </div>
                    <span className="health-badge success">Optimal</span>
                  </div>
                </div>
              </div>

              {/* Latest Users */}
              <div className="widget-card">
                <h3>Latest Registrations</h3>
                <div className="latest-users-list">
                  <div className="user-profile-item">
                    <div className="avatar-circle">J</div>
                    <div className="user-profile-details">
                      <span className="user-profile-name">Julius Caesar</span>
                      <span className="user-profile-email">julius@rome.org</span>
                    </div>
                  </div>
                  <div className="user-profile-item">
                    <div className="avatar-circle">M</div>
                    <div className="user-profile-details">
                      <span className="user-profile-name">Marie Antoinette</span>
                      <span className="user-profile-email">marie@cake.fr</span>
                    </div>
                  </div>
                  <div className="user-profile-item">
                    <div className="avatar-circle">A</div>
                    <div className="user-profile-details">
                      <span className="user-profile-name">Abeda Nyakundi</span>
                      <span className="user-profile-email">abeda@delivo.buzz</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── FIFTH ROW: Top Restaurants, Top Foods, Delivery Analytics ── */}
            <div className="layout-row-five">
              {/* Top Restaurants */}
              <div className="widget-card">
                <h3>Top Restaurants</h3>
                <div className="list-widget">
                  <div className="list-item-ranked">
                    <span className="rank-num">1</span>
                    <div className="list-item-details">
                      <span>Mama Oliech Kitchen</span>
                      <span className="sub">42 orders this week</span>
                    </div>
                  </div>
                  <div className="list-item-ranked">
                    <span className="rank-num">2</span>
                    <div className="list-item-details">
                      <span>Lakeside Dishes</span>
                      <span className="sub">38 orders this week</span>
                    </div>
                  </div>
                  <div className="list-item-ranked">
                    <span className="rank-num">3</span>
                    <div className="list-item-details">
                      <span>Local Delights</span>
                      <span className="sub">29 orders this week</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Foods */}
              <div className="widget-card">
                <h3>Top Menu Items</h3>
                <div className="list-widget">
                  <div className="list-item-ranked">
                    <span className="rank-num">1</span>
                    <div className="list-item-details">
                      <span>Ugali &amp; Sukuma Wiki</span>
                      <span className="sub">55 orders</span>
                    </div>
                  </div>
                  <div className="list-item-ranked">
                    <span className="rank-num">2</span>
                    <div className="list-item-details">
                      <span>Coconut Fish Curry</span>
                      <span className="sub">48 orders</span>
                    </div>
                  </div>
                  <div className="list-item-ranked">
                    <span className="rank-num">3</span>
                    <div className="list-item-details">
                      <span>Chapati Beans</span>
                      <span className="sub">41 orders</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Analytics */}
              <div className="widget-card">
                <h3>Delivery Analytics</h3>
                <div className="delivery-analytics-list">
                  <div className="analytic-stat">
                    <span className="analytic-val">28 mins</span>
                    <span className="analytic-lbl">Avg Delivery Time</span>
                  </div>
                  <div className="analytic-stat">
                    <span className="analytic-val">96.8%</span>
                    <span className="analytic-lbl">Completion Rate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SIXTH ROW: Revenue Trend, Growth Analytics, Customer Activity ── */}
            <div className="layout-row-six">
              {/* Revenue Trend */}
              <div className="widget-card">
                <h3>Revenue Growth Trend</h3>
                <div className="trend-bar-chart">
                  <div className="trend-month-bar">
                    <div className="trend-bar" style={{ height: '35%' }} />
                    <span>Jan</span>
                  </div>
                  <div className="trend-month-bar">
                    <div className="trend-bar" style={{ height: '50%' }} />
                    <span>Feb</span>
                  </div>
                  <div className="trend-month-bar">
                    <div className="trend-bar" style={{ height: '70%' }} />
                    <span>Mar</span>
                  </div>
                  <div className="trend-month-bar">
                    <div className="trend-bar highlight" style={{ height: '90%' }} />
                    <span>Apr</span>
                  </div>
                </div>
              </div>

              {/* Growth Analytics */}
              <div className="widget-card">
                <h3>Growth Metrics</h3>
                <div className="growth-row">
                  <span>Merchant Onboarding Rate</span>
                  <strong className="positive">+12.4% MoM</strong>
                </div>
                <div className="growth-row">
                  <span>Customer Retention Rate</span>
                  <strong className="positive">78.5%</strong>
                </div>
                <div className="growth-row">
                  <span>Active Drivers Conversion</span>
                  <strong className="positive">91.2%</strong>
                </div>
              </div>

              {/* Customer Activity */}
              {/* Customer Activity */}
              <div className="widget-card">
                <h3>Customer Engagement</h3>
                <div className="engagement-metric">
                  <div className="engagement-value">84%</div>
                  <p>Of users order again within 30 days of registration.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </AdminDashboardLayout>
  );
};


export default AdminDashboard;
