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
import { getAdminStats, getMarketplaceAdminOverview } from '../../services/api';

import { formatCurrency } from '../../utils/currency';
import '../pages.css';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    users: 0,
    restaurants: 0,
    orders: 0,
    foods: 0,
    revenue: 0,
  });
  const [marketplaceOverview, setMarketplaceOverview] = useState({ categories: 0, products: 0, lowStockProducts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [data, marketplaceData] = await Promise.all([getAdminStats(), getMarketplaceAdminOverview()]);
      if (data) {
        setStats({
          users: data.users || 0,
          restaurants: data.restaurants || 0,
          orders: data.orders || 0,
          foods: data.foods || 0,
          revenue: data.revenue || 0,
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

  const statCards = [
    {
      label: 'Users',
      value: stats.users,
      icon: Users,
      color: '#16a34a',
      change: '+12%',
      isPositive: true,
      desc: 'Active customer registry'
    },
    {
      label: 'Restaurants',
      value: stats.restaurants,
      icon: Store,
      color: '#16a34a',
      change: '+5%',
      isPositive: true,
      desc: 'Onboarded merchants'
    },
    {
      label: 'Orders',
      value: stats.orders,
      icon: ShoppingCart,
      color: '#16a34a',
      change: '+23%',
      isPositive: true,
      desc: 'Total lifetime deliveries'
    },
    {
      label: 'Revenue',
      value: formatCurrency(stats.revenue),
      icon: DollarSign,
      color: '#22c55e',
      change: '+18%',
      isPositive: true,
      desc: 'Gross marketplace revenue'
    },
    {
      label: 'Marketplace',
      value: marketplaceOverview.products || 0,
      icon: ShoppingBasket,
      color: '#16a34a',
      change: '+14%',
      isPositive: true,
      desc: 'Total active products'
    },
    {
      label: 'Menu Items',
      value: stats.foods,
      icon: UtensilsCrossed,
      color: '#16a34a',
      change: '+8%',
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
              {/* Revenue Large Card */}
              <div className="large-kpi-card revenue-card">
                <div className="kpi-header">
                  <div className="kpi-title-block">
                    <span className="kpi-badge-label">Gross Revenue</span>
                    <h3>{formatCurrency(stats.revenue)}</h3>
                  </div>
                  <div className="kpi-trend positive">
                    <ArrowUpRight size={18} />
                    <span>+18.4%</span>
                  </div>
                </div>
                <div className="kpi-chart-preview">
                  {/* CSS-based classy sparkline/chart effect */}
                  <div className="sparkline-bar" style={{ height: '30%' }} />
                  <div className="sparkline-bar" style={{ height: '45%' }} />
                  <div className="sparkline-bar" style={{ height: '35%' }} />
                  <div className="sparkline-bar" style={{ height: '55%' }} />
                  <div className="sparkline-bar" style={{ height: '70%' }} />
                  <div className="sparkline-bar" style={{ height: '65%' }} />
                  <div className="sparkline-bar" style={{ height: '85%' }} />
                </div>
                <p className="kpi-footer-text">Average order basket value is currently Ksh 1.00</p>
              </div>

              {/* Orders Trend Large Card */}
              <div className="large-kpi-card orders-chart-card">
                <div className="kpi-header">
                  <div className="kpi-title-block">
                    <span className="kpi-badge-label">Orders Trend</span>
                    <h3>{stats.orders} Total</h3>
                  </div>
                  <div className="kpi-trend positive">
                    <ArrowUpRight size={18} />
                    <span>+23%</span>
                  </div>
                </div>
                <div className="mini-bar-chart">
                  {/* Visual CSS-based elegant bar chart */}
                  <div className="chart-bar-col">
                    <div className="bar-fill" style={{ height: '40%' }} />
                    <span className="bar-label">Mon</span>
                  </div>
                  <div className="chart-bar-col">
                    <div className="bar-fill" style={{ height: '55%' }} />
                    <span className="bar-label">Tue</span>
                  </div>
                  <div className="chart-bar-col">
                    <div className="bar-fill animate-grow" style={{ height: '75%' }} />
                    <span className="bar-label">Wed</span>
                  </div>
                  <div className="chart-bar-col">
                    <div className="bar-fill" style={{ height: '60%' }} />
                    <span className="bar-label">Thu</span>
                  </div>
                  <div className="chart-bar-col">
                    <div className="bar-fill" style={{ height: '80%' }} />
                    <span className="bar-label">Fri</span>
                  </div>
                  <div className="chart-bar-col">
                    <div className="bar-fill highlight" style={{ height: '95%' }} />
                    <span className="bar-label">Sat</span>
                  </div>
                  <div className="chart-bar-col">
                    <div className="bar-fill" style={{ height: '70%' }} />
                    <span className="bar-label">Sun</span>
                  </div>
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
                      <tr>
                        <td className="font-mono text-xs">#6a1aa87ffb...</td>
                        <td>Local Delights</td>
                        <td className="font-semibold">KES 4.34</td>
                        <td><span className="badge badge-success">Completed</span></td>
                        <td>Just now</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-xs">#6a1aa92eef...</td>
                        <td>Lakeside Dishes</td>
                        <td className="font-semibold">KES 13.99</td>
                        <td><span className="badge badge-warning">Processing</span></td>
                        <td>5 mins ago</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-xs">#6a1aa10ffa...</td>
                        <td>Street Roasts</td>
                        <td className="font-semibold">KES 5.49</td>
                        <td><span className="badge badge-success">Completed</span></td>
                        <td>12 mins ago</td>
                      </tr>
                      <tr>
                        <td className="font-mono text-xs">#6a1aa48cce...</td>
                        <td>Healthy Bowl</td>
                        <td className="font-semibold">KES 8.96</td>
                        <td><span className="badge badge-danger">Cancelled</span></td>
                        <td>45 mins ago</td>
                      </tr>
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
