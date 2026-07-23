import { useState, useEffect } from 'react';
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
  Bell,
  Activity,
} from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getAdminStats } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import '../pages.css';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    restaurants: 0,
    orders: 0,
    foods: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getAdminStats();
      if (data) {
        setStats({
          users: data.users || 0,
          restaurants: data.restaurants || 0,
          orders: data.orders || 0,
          foods: data.foods || 0,
          revenue: data.revenue || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Users',
      value: stats.users,
      icon: Users,
      color: '#ff6b00',
      change: '+12%',
      isPositive: true,
    },
    {
      label: 'Active Restaurants',
      value: stats.restaurants,
      icon: Store,
      color: '#ff6b00',
      change: '+5%',
      isPositive: true,
    },
    {
      label: 'Total Orders',
      value: stats.orders,
      icon: ShoppingCart,
      color: '#ff6b00',
      change: '+23%',
      isPositive: true,
    },
    {
      label: 'Menu Items',
      value: stats.foods,
      icon: UtensilsCrossed,
      color: '#ff6b00',
      change: '+8%',
      isPositive: true,
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.revenue),
      icon: DollarSign,
      color: '#16a34a',
      change: '+18%',
      isPositive: true,
    },
  ];

  return (
    <AdminDashboardLayout pageTitle="Dashboard">
      <div className="admin-dashboard">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading dashboard metrics...</p>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="stat-card">
                    <div className="stat-header">
                      <div className="stat-icon-wrapper" style={{ background: `${stat.color}15` }}>
                        <Icon size={24} color={stat.color} />
                      </div>
                      <div className="stat-change" style={{ color: stat.isPositive ? '#16a34a' : '#ef4444' }}>
                        {stat.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {stat.change}
                      </div>
                    </div>
                    <div className="stat-content">
                      <p className="stat-label">{stat.label}</p>
                      <h3 className="stat-value">{stat.value}</h3>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="dashboard-info">
              <div className="info-box">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} color="#ff6b00" /> System Overview
                </h3>
                <p>Total Users: <strong>{stats.users}</strong></p>
                <p>Total Orders: <strong>{stats.orders}</strong></p>
                <p>Active Restaurants: <strong>{stats.restaurants}</strong></p>
              </div>

              <div className="info-box">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="#16a34a" /> System Health
                </h3>
                <p><span className="status-indicator online"></span> Server: Operational</p>
                <p><span className="status-indicator online"></span> Database: Connected</p>
                <p><span className="status-indicator online"></span> API: Optimal</p>
              </div>

              <div className="info-box">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={18} color="#16a34a" /> Revenue Metrics
                </h3>
                <p>Total Revenue: <strong>{formatCurrency(stats.revenue)}</strong></p>
                <p>Total Menu Items: <strong>{stats.foods}</strong></p>
                <p>Avg Order Value: <strong>{formatCurrency(stats.orders > 0 ? Math.round(stats.revenue / stats.orders) : 0)}</strong></p>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
