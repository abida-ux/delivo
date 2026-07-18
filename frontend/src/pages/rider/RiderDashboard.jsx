import {useState} from 'react';
import { MapPin, Truck, TrendingUp, DollarSign, Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../pages.css';
import './RiderDashboard.css';

const RiderDashboard = () => {
  const navigate = useNavigate();
  const [rider, setRider] = useState({
    name: 'Michael Brown',
    email: 'michael@delivery.com',
    phone: '+1 (555) 987-6543',
    totalDeliveries: 248,
    totalEarnings: 3245.75,
    rating: 4.9,
    completionRate: 98.5,
    isOnline: true
  });

  const stats = [
    {
      label: 'Total Deliveries',
      value: rider.totalDeliveries,
      icon: Truck,
      color: '#3b82f6'
    },
    {
      label: 'Total Earnings',
      value: `$${rider.totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: '#22c55e'
    },
    {
      label: 'Rating',
      value: rider.rating,
      icon: TrendingUp,
      color: '#f59e0b'
    },
    {
      label: 'Completion Rate',
      value: `${rider.completionRate}%`,
      icon: Clock,
      color: '#8b5cf6'
    }
  ];

  const quickActions = [
    {
      label: 'Available Deliveries',
      description: 'View and accept orders',
      path: '/rider/stores',
      icon: '📍'
    },
    {
      label: 'Active Orders',
      description: 'Orders in progress',
      path: '#',
      icon: '🚗',
      count: 2
    },
    {
      label: 'Delivery History',
      description: 'Past deliveries',
      path: '/rider/history',
      icon: '📋'
    },
    {
      label: 'Earnings',
      description: 'Income & analytics',
      path: '/rider/earnings',
      icon: '💰'
    }
  ];

  const currentDeliveries = [
    {
      id: 1,
      order: 'ORD-5001',
      restaurant: 'Pizza Palace',
      customer: 'John Smith',
      location: '123 Main St',
      distance: '2.5 km',
      pickupTime: '5 mins'
    },
    {
      id: 2,
      order: 'ORD-5002',
      restaurant: 'Burger House',
      customer: 'Jane Doe',
      location: '456 Oak Ave',
      distance: '3.2 km',
      pickupTime: '15 mins'
    }
  ];

  return (
    <div className="rider-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <div>
            <h1>{rider.name}</h1>
            <p>Delivery Partner Dashboard</p>
          </div>
          <div className="status-toggle">
            <span className={rider.isOnline ? 'online' : 'offline'}>
              {rider.isOnline ? '🟢 Online' : '🔴 Offline'}
            </span>
            <button className="toggle-btn">
              {rider.isOnline ? 'Go Offline' : 'Go Online'}
            </button>
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
              onClick={() => action.path !== '#' && navigate(action.path)}
            >
              <div className="icon">{action.icon}</div>
              <div className="content">
                <h3>{action.label}</h3>
                <p>{action.description}</p>
                {action.count && <span className="badge">{action.count}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="current-deliveries-section">
        <div className="section-header">
          <h2>Active Deliveries</h2>
          <span className="count">{currentDeliveries.length}</span>
        </div>
        <div className="deliveries-list">
          {currentDeliveries.map((delivery) => (
            <div key={delivery.id} className="delivery-card">
              <div className="delivery-header">
                <h3>{delivery.order}</h3>
                <span className="badge active">In Progress</span>
              </div>
              <div className="delivery-info">
                <p><strong>Restaurant:</strong> {delivery.restaurant}</p>
                <p><strong>Customer:</strong> {delivery.customer}</p>
                <p><strong>Delivery Location:</strong> {delivery.location}</p>
                <p><strong>Distance:</strong> {delivery.distance} | <strong>Pickup:</strong> {delivery.pickupTime}</p>
              </div>
              <button className="details-btn">View Details</button>
            </div>
          ))}
        </div>
      </div>

      <div className="profile-section">
        <div className="section-header">
          <h2>Profile Information</h2>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <label>Email</label>
            <p>{rider.email}</p>
          </div>
          <div className="info-item">
            <label>Phone</label>
            <p>{rider.phone}</p>
          </div>
          <div className="info-item">
            <label>Vehicle Type</label>
            <p>Motorcycle</p>
          </div>
          <div className="info-item">
            <label>License Plate</label>
            <p>ABC-1234</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
