import React, { useState } from 'react';
import { MapPin, Clock, DollarSign, Navigation, Phone, Check } from 'lucide-react';
import '../pages.css';
import './AvailableDeliveries.css';

const AvailableDeliveries = () => {
  const [deliveries, setDeliveries] = useState([
    {
      id: 1,
      order: 'ORD-5001',
      restaurant: 'Pizza Palace',
      restaurantLocation: '456 Main St',
      customer: 'John Smith',
      deliveryLocation: '123 Oak Ave',
      distance: 2.5,
      estimatedTime: 15,
      payment: 8.50,
      items: 3
    },
    {
      id: 2,
      order: 'ORD-5002',
      restaurant: 'Burger House',
      restaurantLocation: '789 Park St',
      customer: 'Jane Doe',
      deliveryLocation: '321 Pine Ave',
      distance: 3.2,
      estimatedTime: 20,
      payment: 10.00,
      items: 2
    },
    {
      id: 3,
      order: 'ORD-5003',
      restaurant: 'Sushi Delight',
      restaurantLocation: '654 River Rd',
      customer: 'Bob Johnson',
      deliveryLocation: '987 Ocean Dr',
      distance: 4.1,
      estimatedTime: 25,
      payment: 12.50,
      items: 1
    },
    {
      id: 4,
      order: 'ORD-5004',
      restaurant: 'Taco Fiesta',
      restaurantLocation: '111 Market St',
      customer: 'Alice Williams',
      deliveryLocation: '222 Center Ln',
      distance: 1.8,
      estimatedTime: 10,
      payment: 6.50,
      items: 4
    }
  ]);

  const [acceptedDeliveries, setAcceptedDeliveries] = useState([]);

  const handleAcceptDelivery = (id) => {
    const delivery = deliveries.find(d => d.id === id);
    setAcceptedDeliveries([...acceptedDeliveries, delivery]);
    setDeliveries(deliveries.filter(d => d.id !== id));
  };

  const sortBy = 'distance';
  const sortedDeliveries = [...deliveries].sort((a, b) => {
    if (sortBy === 'distance') return a.distance - b.distance;
    if (sortBy === 'payment') return b.payment - a.payment;
    if (sortBy === 'time') return a.estimatedTime - b.estimatedTime;
    return 0;
  });

  return (
    <div className="available-deliveries">
      <div className="page-header">
        <h1>Available Deliveries</h1>
        <p>Find and accept nearby orders</p>
      </div>

      <div className="info-banner">
        <span>ℹ️ {deliveries.length} deliveries available • Tap to view details</span>
      </div>

      {acceptedDeliveries.length > 0 && (
        <div className="accepted-deliveries-section">
          <h2>Accepted Deliveries ({acceptedDeliveries.length})</h2>
          <div className="accepted-list">
            {acceptedDeliveries.map((delivery) => (
              <div key={delivery.id} className="accepted-delivery-card">
                <div className="check-icon">
                  <Check size={20} fill="white" />
                </div>
                <div className="delivery-info">
                  <h3>{delivery.order}</h3>
                  <p>{delivery.restaurant} → {delivery.customer}</p>
                </div>
                <div className="delivery-meta">
                  <span className="distance">{delivery.distance} km</span>
                  <span className="payment">${delivery.payment.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="deliveries-section">
        <div className="section-header">
          <h2>Available Orders</h2>
          <select defaultValue={sortBy} className="sort-select">
            <option value="distance">Nearest</option>
            <option value="payment">Highest Pay</option>
            <option value="time">Fastest Delivery</option>
          </select>
        </div>

        {sortedDeliveries.length === 0 ? (
          <div className="empty-state">
            <Navigation size={48} />
            <h3>No deliveries available</h3>
            <p>Check back soon for new delivery orders</p>
          </div>
        ) : (
          <div className="deliveries-list">
            {sortedDeliveries.map((delivery) => (
              <div key={delivery.id} className="delivery-card">
                <div className="card-header">
                  <h3>{delivery.order}</h3>
                  <span className="badge">{delivery.items} items</span>
                </div>

                <div className="route-info">
                  <div className="location">
                    <span className="icon pickup">📍</span>
                    <div>
                      <p className="label">Pickup</p>
                      <p className="name">{delivery.restaurant}</p>
                      <p className="address">{delivery.restaurantLocation}</p>
                    </div>
                  </div>

                  <div className="route-line">
                    {delivery.distance} km
                  </div>

                  <div className="location">
                    <span className="icon delivery">🏠</span>
                    <div>
                      <p className="label">Delivery</p>
                      <p className="name">{delivery.customer}</p>
                      <p className="address">{delivery.deliveryLocation}</p>
                    </div>
                  </div>
                </div>

                <div className="delivery-details">
                  <div className="detail">
                    <Clock size={16} />
                    <span>{delivery.estimatedTime} mins</span>
                  </div>
                  <div className="detail">
                    <MapPin size={16} />
                    <span>{delivery.distance} km</span>
                  </div>
                  <div className="detail payment">
                    <DollarSign size={16} />
                    <span>${delivery.payment.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  className="accept-btn"
                  onClick={() => handleAcceptDelivery(delivery.id)}
                >
                  <Check size={18} />
                  Accept Delivery
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableDeliveries;
