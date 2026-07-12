import React, { useState } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, Users, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../pages.css';
import './RestaurantDashboard.css';

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState({
    name: 'Pizza Palace',
    email: 'owner@pizzapalace.com',
    phone: '+1 (555) 123-4567',
    address: '456 Park Ave, City',
    openTime: '10:00 AM',
    closeTime: '11:00 PM',
    isOpen: true,
    totalOrders: 1240,
    totalRevenue: 45230.50,
    rating: 4.8
  });

  const stats = [
    {
      label: 'Total Orders',
      value: restaurant.totalOrders,
      icon: ShoppingBag,
      color: '#3b82f6'
    },
    {
      label: 'Revenue',
      value: `$${restaurant.totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: '#22c55e'
    },
    {
      label: 'Rating',
      value: restaurant.rating,
      icon: BarChart3,
      color: '#f59e0b'
    },
    {
      label: 'Active Items',
      value: 45,
      icon: Users,
      color: '#8b5cf6'
    }
  ];

  const quickActions = [
    {
      label: 'Menu Management',
      path: '/restaurant/menu',
      description: 'Manage menu items and categories'
    },
    {
      label: 'Add Product',
      path: '/restaurant/add-product',
      description: 'Add new food items to menu'
    },
    {
      label: 'Orders Management',
      path: '/restaurant/orders',
      description: 'View and manage orders'
    },
    {
      label: 'Earnings',
      path: '/restaurant/earnings',
      description: 'View earnings and analytics'
    }
  ];

  const recentOrders = [
    {
      id: 'ORD-5001',
      customer: 'John Smith',
      items: 3,
      total: 45.99,
      status: 'delivered',
      time: '2 hours ago'
    },
    {
      id: 'ORD-5002',
      customer: 'Jane Doe',
      items: 2,
      total: 32.50,
      status: 'processing',
      time: '15 minutes ago'
    },
    {
      id: 'ORD-5003',
      customer: 'Bob Johnson',
      items: 4,
      total: 58.75,
      status: 'on_the_way',
      time: '30 minutes ago'
    }
  ];

  return (
    <div className="restaurant-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <div>
            <h1>{restaurant.name}</h1>
            <p>Restaurant Management Panel</p>
          </div>
          <div className="status-toggle">
            <span className={restaurant.isOpen ? 'open' : 'closed'}>
              {restaurant.isOpen ? '🟢 Open' : '🔴 Closed'}
            </span>
          </div>
        </div>
      </div>

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

      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action) => (
            <button 
              key={action.label}
              className="action-card"
              onClick={() => navigate(action.path)}
            >
              <h3>{action.label}</h3>
              <p>{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="recent-orders-section">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <button onClick={() => navigate('/restaurant/orders')}>View All</button>
        </div>
        <div className="orders-table">
          <div className="table-header">
            <div>Order ID</div>
            <div>Customer</div>
            <div>Items</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Time</div>
          </div>
          {recentOrders.map((order) => (
            <div key={order.id} className="table-row">
              <div className="cell">{order.id}</div>
              <div className="cell">{order.customer}</div>
              <div className="cell">{order.items}</div>
              <div className="cell">${order.total.toFixed(2)}</div>
              <div className="cell">
                <span className={`badge badge-${order.status}`}>
                  {order.status === 'delivered' ? 'Delivered' :
                   order.status === 'processing' ? 'Processing' :
                   'On the Way'}
                </span>
              </div>
              <div className="cell">{order.time}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="restaurant-info-section">
        <div className="section-header">
          <h2>Restaurant Information</h2>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <label>Email</label>
            <p>{restaurant.email}</p>
          </div>
          <div className="info-item">
            <label>Phone</label>
            <p>{restaurant.phone}</p>
          </div>
          <div className="info-item">
            <label>Address</label>
            <p>{restaurant.address}</p>
          </div>
          <div className="info-item">
            <label>Hours</label>
            <p>{restaurant.openTime} - {restaurant.closeTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
