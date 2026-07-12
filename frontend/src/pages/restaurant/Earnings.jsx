import React, { useState } from 'react';
import { TrendingUp, DollarSign, Calendar, Download, Filter } from 'lucide-react';
import '../pages.css';
import './Earnings.css';

const Earnings = () => {
  const [timeframe, setTimeframe] = useState('month');
  const [earnings, setEarnings] = useState({
    today: 345.50,
    thisWeek: 2450.75,
    thisMonth: 9876.50,
    allTime: 45230.50,
    totalOrders: 1240,
    avgOrderValue: 36.47
  });

  const [transactions, setTransactions] = useState([
    {
      id: 'TXN-001',
      orderId: 'ORD-5001',
      amount: 45.99,
      commission: 2.30,
      net: 43.69,
      date: '2024-05-21',
      time: '18:30',
      status: 'completed'
    },
    {
      id: 'TXN-002',
      orderId: 'ORD-5002',
      amount: 32.50,
      commission: 1.63,
      net: 30.87,
      date: '2024-05-21',
      time: '19:00',
      status: 'completed'
    },
    {
      id: 'TXN-003',
      orderId: 'ORD-5003',
      amount: 18.99,
      commission: 0.95,
      net: 18.04,
      date: '2024-05-21',
      time: '18:45',
      status: 'completed'
    },
    {
      id: 'TXN-004',
      orderId: 'ORD-5004',
      amount: 12.99,
      commission: 0.65,
      net: 12.34,
      date: '2024-05-21',
      time: '17:30',
      status: 'completed'
    },
    {
      id: 'TXN-005',
      orderId: 'ORD-5005',
      amount: 55.75,
      commission: 2.79,
      net: 52.96,
      date: '2024-05-20',
      time: '20:15',
      status: 'completed'
    }
  ]);

  const chartData = {
    month: [
      { date: 'May 1', earnings: 1200 },
      { date: 'May 5', earnings: 1850 },
      { date: 'May 10', earnings: 2100 },
      { date: 'May 15', earnings: 2450 },
      { date: 'May 20', earnings: 2876 }
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
    <div className="earnings-container">
      <div className="page-header">
        <h1>Earnings</h1>
        <p>Track your restaurant revenue and analytics</p>
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
          <DollarSign size={24} className="stat-icon" />
          <div className="stat-content">
            <p className="stat-label">Avg. Order Value</p>
            <h3>${earnings.avgOrderValue.toFixed(2)}</h3>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <div className="stat-content">
            <p className="stat-label">Total Orders</p>
            <h3>{earnings.totalOrders}</h3>
          </div>
        </div>
        <div className="stat-card">
          <Calendar size={24} className="stat-icon" />
          <div className="stat-content">
            <p className="stat-label">Commission Rate</p>
            <h3>5%</h3>
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
                    height: `${(data.earnings / 3000) * 100}%`,
                    backgroundColor: '#ff6b35'
                  }}
                ></div>
              </div>
              <p className="chart-label">{data.date}</p>
              <p className="chart-value">${data.earnings}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="transactions-section">
        <div className="section-header">
          <h2>Recent Transactions</h2>
          <button className="download-btn">
            <Download size={18} />
            Download Report
          </button>
        </div>

        <div className="transactions-table">
          <div className="table-header">
            <div>Transaction ID</div>
            <div>Order ID</div>
            <div>Amount</div>
            <div>Commission</div>
            <div>Net Amount</div>
            <div>Date & Time</div>
            <div>Status</div>
          </div>

          {transactions.map((tx) => (
            <div key={tx.id} className="table-row">
              <div className="cell">{tx.id}</div>
              <div className="cell">{tx.orderId}</div>
              <div className="cell">${tx.amount.toFixed(2)}</div>
              <div className="cell">${tx.commission.toFixed(2)}</div>
              <div className="cell highlight">${tx.net.toFixed(2)}</div>
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
            <p className="amount">${(earnings.thisMonth - (earnings.thisMonth * 0.05)).toFixed(2)}</p>
          </div>
          <div className="info-item">
            <label>Last Payout Date:</label>
            <p>2024-05-15</p>
          </div>
          <div className="info-item">
            <label>Payout Frequency:</label>
            <p>Weekly (Every Monday)</p>
          </div>
        </div>
        <button className="request-payout-btn">Request Payout</button>
      </div>
    </div>
  );
};

export default Earnings;
