import { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  RotateCcw,
  TrendingUp,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Landmark,
  ShieldAlert,
} from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getAdminPayouts, adminRetryPayout, getAdminMpesaBalance } from '../../services/api';
import '../pages.css';
import './AdminPayouts.css';

const AdminPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [stats, setStats] = useState({
    totalDisbursed: 0,
    totalPending: 0,
    completedCount: 0,
    failedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // M-Pesa Account Balance State (Phase 25 & 26)
  const [mpesaBalance, setMpesaBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Retrying state
  const [retryingId, setRetryingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchPayouts = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [res, balRes] = await Promise.all([
        getAdminPayouts({
          page,
          limit: 25,
          status: filterStatus === 'all' ? undefined : filterStatus,
          search: search.trim() || undefined,
        }),
        getAdminMpesaBalance(false).catch(() => null),
      ]);

      if (res?.success) {
        setPayouts(res.data || []);
        setStats(res.stats || {});
        setTotalPages(res.pagination?.pages || 1);
        setTotalCount(res.pagination?.total || 0);
      }

      if (balRes?.success) {
        setMpesaBalance(balRes.data);
      }
    } catch (err) {
      console.error('Error fetching admin payouts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [page, filterStatus]);

  const handleQueryMpesaBalance = async () => {
    try {
      setBalanceLoading(true);
      const res = await getAdminMpesaBalance(true);
      if (res?.success) {
        setMpesaBalance(res.data);
        setActionMessage({
          type: 'success',
          text: res.message || 'M-Pesa balance query dispatched to Safaricom Daraja.',
        });
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to query Safaricom Account Balance',
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPayouts();
  };

  const handleRetry = async (payout) => {
    if (!window.confirm(`Are you sure you want to retry the KSh ${payout.amount} payout to ${payout.phone}?`)) {
      return;
    }

    try {
      setRetryingId(payout._id);
      setActionMessage(null);
      const res = await adminRetryPayout(payout._id);
      if (res?.success) {
        setActionMessage({ type: 'success', text: `Payout #${payout._id.slice(-6)} retry submitted to M-Pesa.` });
        await fetchPayouts(true);
      } else {
        setActionMessage({ type: 'error', text: res?.message || 'Retry failed.' });
      }
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to retry payout.',
      });
    } finally {
      setRetryingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="admin-status-badge completed">
            <CheckCircle2 size={13} /> Paid
          </span>
        );
      case 'processing':
      case 'pending':
        return (
          <span className="admin-status-badge processing">
            <Clock size={13} /> Processing
          </span>
        );
      case 'failed':
        return (
          <span className="admin-status-badge failed">
            <AlertCircle size={13} /> Failed
          </span>
        );
      case 'timeout':
        return (
          <span className="admin-status-badge timeout">
            <Clock size={13} /> Timeout
          </span>
        );
      default:
        return <span className="admin-status-badge">{status}</span>;
    }
  };

  return (
    <AdminDashboardLayout pageTitle="Rider Payouts">
      <div className="admin-payouts-container">
        {/* Header */}
        <div className="admin-page-header">
          <div>
            <h1>M-Pesa Rider Disbursements</h1>
            <p>Monitor, audit, and manage B2C payouts across all registered riders</p>
          </div>
          <button
            className="refresh-btn"
            onClick={() => fetchPayouts(true)}
            disabled={refreshing || loading}
          >
            <RefreshCw size={15} className={refreshing ? 'spinning' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <div className={`admin-alert ${actionMessage.type}`}>
            {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{actionMessage.text}</span>
            <button className="alert-close" onClick={() => setActionMessage(null)}>×</button>
          </div>
        )}

        {/* M-Pesa Shortcode Utility Monitoring Banner */}
        <div className="mpesa-account-banner glass-card">
          <div className="mpesa-account-info">
            <div className="mpesa-icon-badge">
              <Landmark size={20} />
            </div>
            <div>
              <h4>Safaricom M-Pesa B2C Account Status</h4>
              <p>
                {mpesaBalance?.accountBalance
                  ? `Live Balance: ${mpesaBalance.accountBalance}`
                  : 'Safaricom B2C utility account connection active'}
                {mpesaBalance?.lastChecked && (
                  <span className="last-checked-tag">
                    • Checked {new Date(mpesaBalance.lastChecked).toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            className="query-balance-btn"
            onClick={handleQueryMpesaBalance}
            disabled={balanceLoading}
          >
            <RefreshCw size={13} className={balanceLoading ? 'spinning' : ''} />
            <span>{balanceLoading ? 'Querying Daraja...' : 'Check Live M-Pesa Balance'}</span>
          </button>
        </div>

        {/* Platform Stat Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="icon-box green">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="stat-label">Total Disbursed</p>
              <h3>KSh {Number(stats.totalDisbursed || 0).toLocaleString()}</h3>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="icon-box orange">
              <Clock size={22} />
            </div>
            <div>
              <p className="stat-label">Currently Processing</p>
              <h3>KSh {Number(stats.totalPending || 0).toLocaleString()}</h3>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="icon-box blue">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="stat-label">Completed Payouts</p>
              <h3>{stats.completedCount || 0}</h3>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="icon-box red">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="stat-label">Failed Payouts</p>
              <h3>{stats.failedCount || 0}</h3>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="admin-controls-card glass-card">
          <div className="filter-tabs">
            {['all', 'processing', 'completed', 'failed', 'timeout'].map((st) => (
              <button
                key={st}
                className={`filter-tab ${filterStatus === st ? 'active' : ''}`}
                onClick={() => {
                  setFilterStatus(st);
                  setPage(1);
                }}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="search-form">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search rider, phone, receipt, or conversation ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                  fetchPayouts();
                }}
              >
                ×
              </button>
            )}
          </form>
        </div>

        {/* Payouts Table */}
        <div className="admin-table-card glass-card">
          {loading ? (
            <div className="table-loading">
              <RefreshCw size={24} className="spinning" />
              <p>Loading disbursements...</p>
            </div>
          ) : payouts.length === 0 ? (
            <div className="empty-payouts">
              <Wallet size={40} className="empty-icon" />
              <h3>No payouts found</h3>
              <p>No withdrawal records matching your filter criteria.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-payouts-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Rider</th>
                    <th>Amount</th>
                    <th>M-Pesa Phone</th>
                    <th>Receipt</th>
                    <th>Conversation ID</th>
                    <th>Status</th>
                    <th>Attempts</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout._id}>
                      <td>
                        <span className="date-cell">{formatDate(payout.requestedAt || payout.createdAt)}</span>
                      </td>
                      <td>
                        <div className="rider-cell">
                          <strong>{payout.riderId?.name || 'Rider'}</strong>
                          <span className="rider-sub">{payout.riderId?.email || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <strong className="amount-text">KSh {Number(payout.amount || 0).toLocaleString()}</strong>
                      </td>
                      <td>
                        <span className="phone-cell">
                          <Smartphone size={13} />
                          {payout.phone}
                        </span>
                      </td>
                      <td>
                        {payout.transactionReceipt ? (
                          <code className="receipt-badge">{payout.transactionReceipt}</code>
                        ) : (
                          <span className="dim-cell">—</span>
                        )}
                      </td>
                      <td>
                        {payout.conversationId ? (
                          <span className="conv-id" title={payout.conversationId}>
                            {payout.conversationId.slice(0, 12)}...
                          </span>
                        ) : (
                          <span className="dim-cell">—</span>
                        )}
                      </td>
                      <td>{getStatusBadge(payout.status)}</td>
                      <td>
                        <span className="attempt-badge">
                          {payout.attempts?.length || 1} {payout.attempts?.length === 1 ? 'try' : 'tries'}
                        </span>
                      </td>
                      <td>
                        {payout.status === 'failed' ? (
                          <button
                            className="retry-btn"
                            onClick={() => handleRetry(payout)}
                            disabled={retryingId === payout._id}
                            title="Retry B2C disbursement to rider"
                          >
                            <RotateCcw size={13} className={retryingId === payout._id ? 'spinning' : ''} />
                            <span>{retryingId === payout._id ? 'Retrying...' : 'Retry'}</span>
                          </button>
                        ) : (
                          <span className="no-action-text">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <span className="pagination-info">
                Showing {payouts.length} of {totalCount} records (Page {page} of {totalPages})
              </span>
              <div className="pagination-controls">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                  className="page-btn"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="page-btn"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminPayouts;
