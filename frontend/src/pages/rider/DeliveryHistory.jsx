import React, { useState } from 'react';
import { CheckCircle, Clock, MapPin, Calendar, Filter, Award } from 'lucide-react';
import '../pages.css';
import './DeliveryHistory.css';

const DeliveryHistory = () => {
  const [deliveries, setDeliveries] = useState([
    {
      id: 1,
      order: 'ORD-5001',
      restaurant: 'Pizza Palace',
      customer: 'John Smith',
      date: '2024-05-21',
      time: '18:45',
      distance: 2.5,
      duration: 18,
      payment: 8.50,
      rating: 5,
      status: 'completed'
    },
    {
      id: 2,
      order: 'ORD-5002',
      restaurant: 'Burger House',
      customer: 'Jane Doe',
      date: '2024-05-21',
      time: '19:15',
      distance: 3.2,
      duration: 22,
      payment: 10.00,
      rating: 5,
      status: 'completed'
    },
    {
      id: 3,
      order: 'ORD-5003',
      restaurant: 'Sushi Delight',
      customer: 'Bob Johnson',
      date: '2024-05-21',
      time: '18:30',
      distance: 4.1,
      duration: 28,
      payment: 12.50,
      rating: 4,
      status: 'completed'
    },
    {
      id: 4,
      order: 'ORD-5004',
      restaurant: 'Taco Fiesta',
      customer: 'Alice Williams',
      date: '2024-05-20',
      time: '20:00',
      distance: 1.8,
      duration: 15,
      payment: 6.50,
      rating: 5,
      status: 'completed'
    },
    {
      id: 5,
      order: 'ORD-5005',
      restaurant: 'Pizza Palace',
      customer: 'Charlie Brown',
      date: '2024-05-20',
      time: '19:30',
      distance: 2.0,
      duration: 14,
      payment: 7.50,
      rating: 4,
      status: 'completed'
    }
  ]);

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [filterDate, setFilterDate] = useState('all');

  const stats = {
    totalDeliveries: deliveries.length,
    totalDistance: deliveries.reduce((sum, d) => sum + d.distance, 0),
    totalEarnings: deliveries.reduce((sum, d) => sum + d.payment, 0),
    avgRating: (deliveries.reduce((sum, d) => sum + d.rating, 0) / deliveries.length).toFixed(1)
  };

  const filteredDeliveries = deliveries.filter(d => {
    if (filterDate === 'all') return true;
    if (filterDate === 'today') return d.date === new Date().toISOString().split('T')[0];
    if (filterDate === 'week') return {
      // Simple week filter - in real app would use date library
    };
    return true;
  });

  return (
    <div className="delivery-history">
      <div className="page-header">
        <h1>Delivery History</h1>
        <p>Track all your completed deliveries</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <MapPin size={24} className="icon" />
          <div className="stat-content">
            <p className="label">Total Distance</p>
            <h3>{stats.totalDistance.toFixed(1)} km</h3>
          </div>
        </div>
        <div className="stat-card">
          <CheckCircle size={24} className="icon" />
          <div className="stat-content">
            <p className="label">Deliveries</p>
            <h3>{stats.totalDeliveries}</h3>
          </div>
        </div>
        <div className="stat-card">
          <span className="icon">💰</span>
          <div className="stat-content">
            <p className="label">Total Earnings</p>
            <h3>${stats.totalEarnings.toFixed(2)}</h3>
          </div>
        </div>
        <div className="stat-card">
          <Award size={24} className="icon" />
          <div className="stat-content">
            <p className="label">Avg Rating</p>
            <h3>{stats.avgRating} ⭐</h3>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <button 
          className={filterDate === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterDate('all')}
        >
          All Time
        </button>
        <button 
          className={filterDate === 'today' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterDate('today')}
        >
          Today
        </button>
        <button 
          className={filterDate === 'week' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterDate('week')}
        >
          This Week
        </button>
        <button 
          className={filterDate === 'month' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterDate('month')}
        >
          This Month
        </button>
      </div>

      <div className="deliveries-list">
        {filteredDeliveries.map((delivery) => (
          <div
            key={delivery.id}
            className="delivery-item"
            onClick={() => setSelectedDelivery(
              selectedDelivery?.id === delivery.id ? null : delivery
            )}
          >
            <div className="delivery-header">
              <div className="order-info">
                <h3>{delivery.order}</h3>
                <p>{delivery.restaurant} → {delivery.customer}</p>
              </div>
              <div className="delivery-meta">
                <span className="date">{delivery.date}</span>
                <span className="time">{delivery.time}</span>
              </div>
            </div>

            {selectedDelivery?.id === delivery.id && (
              <div className="delivery-details">
                <div className="details-grid">
                  <div className="detail">
                    <label>Distance</label>
                    <p>{delivery.distance} km</p>
                  </div>
                  <div className="detail">
                    <label>Duration</label>
                    <p>{delivery.duration} mins</p>
                  </div>
                  <div className="detail">
                    <label>Payment</label>
                    <p className="amount">${delivery.payment.toFixed(2)}</p>
                  </div>
                  <div className="detail">
                    <label>Customer Rating</label>
                    <p className="rating">{'⭐'.repeat(delivery.rating)}</p>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="action-btn">
                    <MapPin size={16} />
                    View Route
                  </button>
                  <button className="action-btn">
                    <Calendar size={16} />
                    View Invoice
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredDeliveries.length === 0 && (
        <div className="empty-state">
          <Clock size={48} />
          <h3>No deliveries yet</h3>
          <p>Your completed deliveries will appear here</p>
        </div>
      )}
    </div>
  );
};

export default DeliveryHistory;
