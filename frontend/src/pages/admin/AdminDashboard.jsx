import React, { useState, useEffect } from 'react';
import {
  Users,
  Store,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  UtensilsCrossed,
  DollarSign,
} from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getAllUsers, getAllRestaurants, getAllFoods, getAllOrders } from '../../services/api';
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
      const [usersRes, restaurantsRes, foodsRes, ordersRes] = await Promise.all([
        getAllUsers(),
        getAllRestaurants(),
        getAllFoods(),
        getAllOrders(),
      ]);

      const users = Array.isArray(usersRes) ? usersRes : usersRes.data || [];
      const restaurants = Array.isArray(restaurantsRes) ? restaurantsRes : restaurantsRes.data || [];
      const foods = Array.isArray(foodsRes) ? foodsRes : foodsRes.data || [];
      const orders = Array.isArray(ordersRes) ? ordersRes : ordersRes.data || [];

      // Calculate total revenue from orders
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      setStats({
        users: users.length,
        restaurants: restaurants.length,
        orders: orders.length,
        foods: foods.length,
        revenue: totalRevenue,
      });
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
      color: '#3b82f6',
      change: '+12%',
      isPositive: true,
    },
    {
      label: 'Active Restaurants',
      value: stats.restaurants,
      icon: Store,
      color: '#22c55e',
      change: '+5%',
      isPositive: true,
    },
    {
      label: 'Total Orders',
      value: stats.orders,
      icon: ShoppingCart,
      color: '#f59e0b',
      change: '+23%',
      isPositive: true,
    },
    {
      label: 'Menu Items',
      value: stats.foods,
      icon: UtensilsCrossed,
      color: '#8b5cf6',
      change: '+8%',
      isPositive: true,
    },
    {
      label: 'Total Revenue',
      value: `$${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: '#ec4899',
      change: '+18%',
      isPositive: true,
    },
  ];

  return (
    <AdminDashboardLayout pageTitle="Dashboard">
      <div className="admin-dashboard">
        <div className="stats-grid">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon-wrapper" style={{ background: `${stat.color}20` }}>
                    <Icon size={24} color={stat.color} />
                  </div>
                  <div className="stat-change" style={{ color: stat.isPositive ? '#22c55e' : '#ef4444' }}>
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
            <h3>📊 Overview</h3>
            <p>Total Users: <strong>{stats.users}</strong></p>
            <p>Total Orders: <strong>{stats.orders}</strong></p>
            <p>Active Restaurants: <strong>{stats.restaurants}</strong></p>
          </div>

          <div className="info-box">
            <h3>🔔 System Status</h3>
            <p><span className="status-indicator online"></span> Server: Online</p>
            <p><span className="status-indicator online"></span> Database: Connected</p>
            <p><span className="status-indicator online"></span> API: Operational</p>
          </div>

          <div className="info-box">
            <h3>💰 Revenue Info</h3>
            <p>Total Revenue: <strong>KES {stats.revenue?.toLocaleString() || '0'}</strong></p>
            <p>Total Menu Items: <strong>{stats.foods}</strong></p>
            <p>Avg Order Value: <strong>KES {stats.orders > 0 ? Math.round(stats.revenue / stats.orders) : '0'}</strong></p>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
