import React, { useState } from 'react';
import { TrendingUp, DollarSign, Calendar, Download, Wallet } from 'lucide-react';
import '../pages.css';
import './Earnings.css';

const RiderEarnings = () => {
  const [timeframe, setTimeframe] = useState('month');
  const [earnings, setEarnings] = useState({
    today: 85.50,
    thisWeek: 425.75,
    thisMonth: 1645.30,
    allTime: 3245.75,
    totalDeliveries: 248,
    avgDeliveryPay: 13.07
  });

  const [transactions, setTransactions] = useState([
    {
      id: 'DEL-001',
      orderId: 'ORD-5001',
      restaurant: 'Pizza Palace',
      amount: 8.50,
      distance: 2.5,
      date: '2024-05-21',
      time: '18:45',
      status: 'completed'
    },
    {
      id: 'DEL-002',
      orderId: 'ORD-5002',
      restaurant: 'Burger House',
      amount: 10.00,
      distance: 3.2,
      date: '2024-05-21',
      time: '19:15',
      status: 'completed'
    },
    {
      id: 'DEL-003',
      orderId: 'ORD-5003',
      restaurant: 'Sushi Delight',
      amount: 12.50,
      distance: 4.1,
      date: '2024-05-21',
      time: '18:30',
      status: 'completed'
    },
    {
      id: 'DEL-004',
      orderId: 'ORD-5004',
      restaurant: 'Taco Fiesta',
      amount: 6.50,
      distance: 1.8,
      date: '2024-05-21',
      time: '17:45',
      status: 'completed'
    },
    {
      id: 'DEL-005',
      orderId: 'ORD-5005',
      restaurant: 'Pizza Palace',
      amount: 48.00,
      distance: 12.5,
      date: '2024-05-20',
      time: '20:15',
      status: 'completed'
    }
  ]);

  const chartData = {
    month: [
      { week: 'Week 1', earnings: 350 },
      { week: 'Week 2', earnings: 420 },
      { week: 'Week 3', earnings: 385 },
      { week: 'Week 4', earnings: 490 }
    ]
  };

  const getCurrentEarnings = () => {
    switch (timeframe) {
      case 'today': return earnings.today;
      case 'week': return earnings.thisWeek;
      case 'month': return earnings.thisMonth;
      case 'all': return earnings.allTime;
      default: return earnings.thisMonth;
    }
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'today': return "Today's";
      case 'week': return "This Week's";
      case 'month': return "This Month's";
      case 'all': return "Total";
      default: return "This Month's";
    }
  };

  return (
    <div className="rider-earnings">
      <div className="page-header">
        <h1>Earnings</h1>
        <p>Track your delivery earnings and performance</p>
      </div>

      <div className="earnings-overview">
        <div className="earning-card primary">
          <div className="card-top">
            <div>
              <p className="label">{getTimeframeLabel()} Earnings</p>
              <h2 className="amount">${getCurrentEarnings().toFixed(2)}</h2>
            </div>
            <TrendingUp size={32} className="icon" />
          </div>

          <div className="timeframe-buttons">
            {['today', 'week', 'month', 'all'].map((tf) => (
              <button
                key={tf}
                className={timeframe === tf ? 'tf-btn active' : 'tf-btn'}
                onClick={() => setTimeframe(tf)}
              >
                {tf === 'today' ? 'Today' : tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Wallet size={24} className="stat-icon" />
          <div className="stat-content">
            <p className="stat-label">Avg. Per Delivery</p>
            <h3>${earnings.avgDeliveryPay.toFixed(2)}</h3>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <div className="stat-content">
            <p className="stat-label">Total Deliveries</p>
            <h3>{earnings.totalDeliveries}</h3>
          </div>
        </div>
        <div className="stat-card">
          <Calendar size={24} className="stat-icon" />
          <div className="stat-content">
            <p className="stat-label">Pending Payout</p>
            <h3>${(earnings.thisMonth * 0.85).toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <div className="chart-section">
        <h2>Earnings Trend</h2>
        <div className="simple-chart">
          {chartData.month.map((data, idx) => (
            <div key={idx} className="chart-bar-container">
              <div className="chart-bar-wrapper">
                <div 
                  className="chart-bar" 
                  style={{ 
                    height: `${(data.earnings / 500) * 100}%`,
                    backgroundColor: '#ff6b35'
                  }}
                ></div>
              </div>
              <p className="chart-label">{data.week}</p>
              <p className="chart-value">${data.earnings}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="transactions-section">
        <div className="section-header">
          <h2>Recent Deliveries</h2>
          <button className="download-btn">
            <Download size={18} />
            Download Report
          </button>
        </div>

        <div className="transactions-table">
          <div className="table-header">
            <div>Delivery ID</div>
            <div>Order ID</div>
            <div>Restaurant</div>
            <div>Distance</div>
            <div>Earnings</div>
            <div>Date & Time</div>
            <div>Status</div>
          </div>

          {transactions.map((tx) => (
            <div key={tx.id} className="table-row">
              <div className="cell">{tx.id}</div>
              <div className="cell">{tx.orderId}</div>
              <div className="cell">{tx.restaurant}</div>
              <div className="cell">{tx.distance} km</div>
              <div className="cell highlight">${tx.amount.toFixed(2)}</div>
              <div className="cell">{tx.date} {tx.time}</div>
              <div className="cell">
                <span className="status-badge completed">{tx.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="payout-section">
        <h2>Payout Information</h2>
        <div className="payout-info">
          <div className="info-item">
            <label>Available for Payout:</label>
            <p className="amount">${(earnings.thisMonth * 0.85).toFixed(2)}</p>
          </div>
          <div className="info-item">
            <label>Last Payout Date:</label>
            <p>2024-05-19</p>
          </div>
          <div className="info-item">
            <label>Next Payout Date:</label>
            <p>2024-05-26</p>
          </div>
        </div>
        <button className="request-payout-btn">Request Payout</button>
      </div>
    </div>
  );
};

export default RiderEarnings;
