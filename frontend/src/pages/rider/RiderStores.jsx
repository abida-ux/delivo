import {useState, useEffect, useContext} from 'react';
import { MapPin, Clock, DollarSign, Package, Search, Loader, ChevronRight, Navigation } from 'lucide-react';
import './RiderStores.css';
import { useNavigate } from 'react-router-dom';
import { getAllOrders } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const RiderStores = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [filters, setFilters] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('distance');
  const [acceptedDeliveries, setAcceptedDeliveries] = useState([]);

  // Redirect if not a rider
  useEffect(() => {
    if (user && user.role !== 'rider') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch available orders/deliveries from API
  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setLoading(true);
        const data = await getAllOrders();
        
        // Filter for orders that are pending delivery (not yet assigned to rider)
        const availableOrders = data.filter(order => 
          order.status === 'preparing' || 
          order.status === 'confirmed' ||
          (order.status === 'on-delivery' && !order.riderId)
        );
        
        console.log('📦 Fetched available deliveries:', availableOrders);
        setDeliveries(availableOrders);
        setError(null);
      } catch (err) {
        console.error('❌ Error fetching deliveries:', err);
        setError('Failed to load available deliveries');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, []);

  // Filter deliveries based on search and filter
  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch = 
      delivery.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery._id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filters === 'available') {
      return matchesSearch && (delivery.status === 'preparing' || delivery.status === 'confirmed');
    }
    if (filters === 'nearby') {
      return matchesSearch && delivery.distance <= 5;
    }
    if (filters === 'high-earning') {
      return matchesSearch && delivery.totalPrice >= 50;
    }
    return matchesSearch;
  });

  // Sort deliveries
  const sortedDeliveries = [...filteredDeliveries].sort((a, b) => {
    if (sortBy === 'distance') {
      return (a.distance || 0) - (b.distance || 0);
    }
    if (sortBy === 'earnings') {
      return (b.deliveryFee || 0) - (a.deliveryFee || 0);
    }
    if (sortBy === 'time') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return 0;
  });

  const handleAcceptDelivery = (deliveryId) => {
    setAcceptedDeliveries([...acceptedDeliveries, deliveryId]);
    console.log('✅ Accepted delivery:', deliveryId);
    alert('Delivery accepted! Head to the restaurant to pickup the order.');
  };

  const handleRejectDelivery = (deliveryId) => {
    setDeliveries(deliveries.filter(d => d._id !== deliveryId));
    console.log('❌ Rejected delivery:', deliveryId);
  };

  const stats = [
    {
      label: 'Available Orders',
      value: filteredDeliveries.length,
      icon: '📦',
      color: '#3b82f6'
    },
    {
      label: 'Potential Earnings',
      value: `$${(filteredDeliveries.reduce((sum, d) => sum + (d.deliveryFee || 2), 0)).toFixed(2)}`,
      icon: '💰',
      color: '#22c55e'
    },
    {
      label: 'Avg Distance',
      value: `${((filteredDeliveries.reduce((sum, d) => sum + (d.distance || 0), 0) / filteredDeliveries.length) || 0).toFixed(1)} km`,
      icon: '📍',
      color: '#f59e0b'
    },
    {
      label: 'Accepted Today',
      value: acceptedDeliveries.length,
      icon: '✅',
      color: '#8b5cf6'
    }
  ];

  return (
    <div className="rider-stores-container">
      {/* Header */}
      <div className="rider-header">
        <div className="rider-header-top">
          <div>
            <h1>Available Deliveries</h1>
            <p>Accept and complete orders to earn money</p>
          </div>
          <button className="map-btn">
            <Navigation size={18} />
            View on Map
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="rider-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="rider-stat-card">
            <span className="stat-icon">{stat.icon}</span>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="rider-search-section">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer name, address, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Filter:</label>
            <select 
              value={filters} 
              onChange={(e) => setFilters(e.target.value)}
              className="filter-select"
            >
              <option value="available">All Available</option>
              <option value="nearby">Nearby (5km)</option>
              <option value="high-earning">High Earning</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="distance">Distance</option>
              <option value="earnings">Earnings</option>
              <option value="time">Recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <Loader size={40} className="spinner" />
          <p>Loading available deliveries...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Deliveries List */}
      {!loading && sortedDeliveries.length > 0 ? (
        <div className="deliveries-list">
          {sortedDeliveries.map((delivery) => {
            const isAccepted = acceptedDeliveries.includes(delivery._id);
            const deliveryFee = delivery.deliveryFee || 2;
            const distance = delivery.distance || 3;
            const estimatedTime = Math.round(distance / 30 * 60); // Estimate based on distance

            return (
              <div
                key={delivery._id}
                className={`delivery-card ${isAccepted ? 'accepted' : ''}`}
              >
                <div className="delivery-card-main">
                  <div className="delivery-info">
                    <div className="delivery-header">
                      <h3>Order #{delivery._id?.slice(-6).toUpperCase()}</h3>
                      <span className="status-badge">{delivery.status}</span>
                    </div>

                    <div className="customer-info">
                      <p className="customer-name">
                        📦 {delivery.userId?.name || 'Unknown Customer'}
                      </p>
                      <p className="delivery-address">
                        <MapPin size={14} />
                        {delivery.deliveryAddress}
                      </p>
                    </div>

                    <div className="delivery-details">
                      <div className="detail-item">
                        <Clock size={14} />
                        <span>{estimatedTime} mins</span>
                      </div>
                      <div className="detail-item">
                        <MapPin size={14} />
                        <span>{distance} km away</span>
                      </div>
                      <div className="detail-item">
                        <Package size={14} />
                        <span>{delivery.items?.length || 1} items</span>
                      </div>
                    </div>

                    <div className="delivery-price">
                      <span className="price-label">Delivery Fee:</span>
                      <span className="price-amount">${deliveryFee.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="delivery-actions">
                    {!isAccepted ? (
                      <>
                        <button
                          className="accept-btn"
                          onClick={() => handleAcceptDelivery(delivery._id)}
                        >
                          Accept Delivery
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleRejectDelivery(delivery._id)}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <div className="accepted-badge">
                        ✅ Accepted
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !loading && (
          <div className="no-deliveries">
            <div className="empty-state">
              <Package size={48} className="empty-icon" />
              <h2>No Available Deliveries</h2>
              <p>Check back later for more orders or adjust your filters</p>
              <button 
                className="refresh-btn"
                onClick={() => window.location.reload()}
              >
                Refresh
              </button>
            </div>
          </div>
        )
      )}

      {/* Quick Tips */}
      <div className="tips-section">
        <h3>💡 Pro Tips to Earn More</h3>
        <ul>
          <li>Accept nearby orders to complete more deliveries</li>
          <li>High-earning orders during peak hours (11am-1pm, 6pm-8pm)</li>
          <li>Keep your rating above 4.5 to get premium orders</li>
          <li>Go online during busy times for more delivery requests</li>
        </ul>
      </div>
    </div>
  );
};

export default RiderStores;
