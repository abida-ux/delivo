import {useState, useEffect} from 'react';
import { Download, Filter, Calendar, TrendingUp, DollarSign, BarChart3, CheckCircle2 } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getAllOrders } from '../../services/api';
import '../pages.css';
import './Transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const ordersRes = await getAllOrders();
      const orders = Array.isArray(ordersRes) ? ordersRes : ordersRes.data || [];

      // Convert orders to transaction format
      const txns = orders.map((order, idx) => ({
        id: `TXN-${String(idx + 1).padStart(3, '0')}`,
        orderId: order._id || `ORD-${idx + 1}`,
        restaurant: order.restaurantId?.name || 'Unknown Restaurant',
        customer: order.userId?.name || 'Unknown Customer',
        amount: order.totalPrice || 0,
        commission: (order.totalPrice || 0) * 0.05, // 5% commission
        netAmount: (order.totalPrice || 0) * 0.95,
        type: 'order_payment',
        date: new Date(order.createdAt).toLocaleDateString(),
        time: new Date(order.createdAt).toLocaleTimeString(),
        status: order.status || 'completed',
      }));

      setTransactions(txns);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const typeMatch = filterType === 'all' || tx.type === filterType;
    const statusMatch = filterStatus === 'all' || tx.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const stats = {
    totalTransactions: transactions.length,
    totalRevenue: transactions.reduce((sum, tx) => sum + tx.amount, 0),
    totalCommission: transactions.reduce((sum, tx) => sum + tx.commission, 0),
    averageTransaction: transactions.filter(t => t.type === 'order_payment').length > 0
      ? (transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactions.filter(t => t.type === 'order_payment').length).toFixed(2)
      : '0'
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'order_payment': return 'Order Payment';
      case 'payout': return 'Payout';
      case 'refund': return 'Refund';
      default: return 'Transaction';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'order_payment': return '#3b82f6';
      case 'payout': return '#22c55e';
      case 'refund': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <AdminDashboardLayout pageTitle="Transactions">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading transactions...</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout pageTitle="Transactions">
      <div className="transactions-container">
        <div className="page-header">
          <h1>Transactions</h1>
          <p>View and manage all platform transactions</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <TrendingUp size={24} className="stat-icon" />
            <div className="stat-content">
              <p className="stat-label">Total Revenue</p>
              <h3>Ksh {stats.totalRevenue?.toFixed(2) || '0'}</h3>
            </div>
          </div>
          <div className="stat-card">
            <DollarSign size={24} className="stat-icon" />
            <div className="stat-content">
              <p className="stat-label">Total Commission</p>
              <h3>Ksh {stats.totalCommission?.toFixed(2) || '0'}</h3>
            </div>
          </div>
          <div className="stat-card">
            <BarChart3 size={24} className="stat-icon" />
            <div className="stat-content">
              <p className="stat-label">Avg Transaction</p>
              <h3>Ksh {stats.averageTransaction || '0'}</h3>
            </div>
          </div>
          <div className="stat-card">
            <CheckCircle2 size={24} className="stat-icon" />
            <div className="stat-content">
              <p className="stat-label">Total Transactions</p>
              <h3>{stats.totalTransactions}</h3>
            </div>
          </div>
        </div>


        <div className="controls-section">
          <div className="filter-buttons">
            <button 
              className={filterType === 'all' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterType('all')}
            >
              All Types
            </button>
            <button 
              className={filterType === 'order_payment' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterType('order_payment')}
            >
              Orders
            </button>
            <button 
              className={filterType === 'payout' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterType('payout')}
            >
              Payouts
            </button>
          </div>

          <button className="download-btn">
            <Download size={18} />
            Export Report
          </button>
        </div>

        <div className="transactions-table">
          <div className="table-header">
            <div>Transaction ID</div>
            <div>Order ID</div>
            <div>Restaurant</div>
          <div>Amount</div>
          <div>Commission</div>
          <div>Net Amount</div>
          <div>Type</div>
          <div>Date & Time</div>
          <div>Status</div>
        </div>

        {filteredTransactions.map((tx) => (
          <div key={tx.id} className="table-row">
            <div className="cell">{tx.id}</div>
            <div className="cell">{tx.orderId}</div>
            <div className="cell">{tx.restaurant}</div>
            <div className="cell">Ksh {tx.amount?.toFixed(2) || '0'}</div>
            <div className="cell">Ksh {tx.commission?.toFixed(2) || '0'}</div>
            <div className="cell highlight">Ksh {tx.netAmount?.toFixed(2) || '0'}</div>
            <div className="cell">
              <span 
                className="type-badge"
                style={{ backgroundColor: getTypeColor(tx.type) + '20', color: getTypeColor(tx.type) }}
              >
                {getTypeLabel(tx.type)}
              </span>
            </div>
            <div className="cell">{tx.date} {tx.time}</div>
            <div className="cell">
              <span className="status-badge completed">{tx.status}</span>
            </div>
          </div>
        ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="empty-state">
            <p>No transactions found</p>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default Transactions;
