import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Wallet,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  X,
  Smartphone,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { getRiderEarningsSummary, getRiderPayouts, requestRiderWithdrawal } from '../../services/api';
import '../pages.css';
import './Earnings.css';

const RiderEarnings = () => {
  const [summary, setSummary] = useState({
    availableBalance: 0,
    pendingPayoutBalance: 0,
    totalWithdrawn: 0,
    totalEarnings: 0,
    totalDeliveries: 0,
    riderName: '',
    phone: '',
  });

  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [summaryRes, payoutsRes] = await Promise.all([
        getRiderEarningsSummary(),
        getRiderPayouts(1, 30),
      ]);

      if (summaryRes) {
        setSummary(summaryRes);
        if (!withdrawPhone && summaryRes.phone) {
          setWithdrawPhone(summaryRes.phone);
        }
      }

      if (payoutsRes?.data) {
        setPayouts(payoutsRes.data);
      }
    } catch (err) {
      console.error('Error fetching rider earnings data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setWithdrawAmount('');
    setWithdrawPhone(summary.phone || '');
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setIsModalOpen(false);
      setFeedback(null);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid amount to withdraw.' });
      return;
    }

    if (amountNum < 10) {
      setFeedback({ type: 'error', message: 'Minimum withdrawal amount is KSh 10.' });
      return;
    }

    if (amountNum > summary.availableBalance) {
      setFeedback({
        type: 'error',
        message: `Amount exceeds available balance of KSh ${summary.availableBalance.toLocaleString()}.`,
      });
      return;
    }

    if (!withdrawPhone.trim()) {
      setFeedback({ type: 'error', message: 'Please enter an M-Pesa phone number.' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await requestRiderWithdrawal({
        amount: amountNum,
        phone: withdrawPhone.trim(),
      });

      if (res?.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'Withdrawal submitted! Funds are being sent to your M-Pesa.',
        });
        // Refresh summary and history
        await fetchData(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setWithdrawAmount('');
          setFeedback(null);
        }, 2200);
      } else {
        setFeedback({
          type: 'error',
          message: res?.message || 'Withdrawal failed. Please check your details and try again.',
        });
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      const errorMsg =
        err.response?.data?.message || err.message || 'Withdrawal could not be processed. Please try again.';
      setFeedback({ type: 'error', message: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const maskPhone = (phoneStr) => {
    if (!phoneStr) return '—';
    const clean = String(phoneStr).replace(/\D/g, '');
    if (clean.length >= 9) {
      return `${clean.slice(0, 4)}****${clean.slice(-3)}`;
    }
    return phoneStr;
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
          <span className="status-badge completed">
            <CheckCircle2 size={13} /> Paid
          </span>
        );
      case 'processing':
      case 'pending':
        return (
          <span className="status-badge processing">
            <Clock size={13} /> Processing
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="status-badge failed">
            <AlertCircle size={13} /> Failed
          </span>
        );
      case 'timeout':
        return (
          <span className="status-badge timeout">
            <Clock size={13} /> Timeout
          </span>
        );
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="rider-earnings">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Rider Earnings & Payouts</h1>
          <p>Manage your delivery revenue and withdraw directly to M-Pesa</p>
        </div>
        <button
          className="refresh-btn"
          onClick={() => fetchData(true)}
          disabled={refreshing || loading}
          title="Refresh balances"
        >
          <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
          <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Main Available Balance Hero Card */}
      <div className="earnings-overview">
        <div className="earning-card primary">
          <div className="card-top">
            <div>
              <p className="label">Available For Withdrawal</p>
              <h2 className="main-val">KSh {Number(summary.availableBalance || 0).toLocaleString()}</h2>
              <p className="card-subtext">Earned from completed deliveries ready for M-Pesa payout</p>
            </div>
            <div className="hero-icon-container">
              <Wallet size={36} className="hero-icon" />
            </div>
          </div>

          <div className="payout-action-row">
            <button
              className="request-payout-btn hero-btn"
              onClick={handleOpenModal}
              disabled={Number(summary.availableBalance || 0) < 10}
            >
              <ArrowDownToLine size={18} />
              <span>Withdraw to M-Pesa</span>
            </button>
            {summary.pendingPayoutBalance > 0 && (
              <div className="pending-badge">
                <Clock size={14} />
                <span>KSh {Number(summary.pendingPayoutBalance).toLocaleString()} processing</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Earned</p>
            <h3>KSh {Number(summary.totalEarnings || 0).toLocaleString()}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Withdrawn</p>
            <h3>KSh {Number(summary.totalWithdrawn || 0).toLocaleString()}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <span className="stat-emoji">📦</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">Delivered Orders</p>
            <h3>{summary.totalDeliveries || 0}</h3>
          </div>
        </div>
      </div>

      {/* Payout / Withdrawal History Table */}
      <div className="transactions-section">
        <div className="section-header">
          <div>
            <h2>Withdrawal History</h2>
            <p className="section-subtitle">Record of all M-Pesa B2C disbursements</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <RefreshCw size={24} className="spinning" />
            <p>Loading payouts...</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="empty-state-card">
            <Wallet size={40} className="empty-icon" />
            <h3>No withdrawals yet</h3>
            <p>When you request a payout to your M-Pesa number, it will appear here.</p>
          </div>
        ) : (
          <div className="transactions-table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Amount</th>
                  <th>M-Pesa Number</th>
                  <th>Receipt / Ref</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((tx) => (
                  <tr key={tx._id}>
                    <td>{formatDate(tx.requestedAt || tx.createdAt)}</td>
                    <td className="amount-col">
                      <strong>KSh {Number(tx.amount || 0).toLocaleString()}</strong>
                    </td>
                    <td>{maskPhone(tx.phone)}</td>
                    <td>
                      {tx.transactionReceipt ? (
                        <code className="receipt-code">{tx.transactionReceipt}</code>
                      ) : (
                        <span className="dim-text">Pending</span>
                      )}
                    </td>
                    <td>{getStatusBadge(tx.status)}</td>
                    <td className="details-col">
                      {tx.status === 'failed' ? (
                        <span className="failure-text" title={tx.failureReason}>
                          {tx.failureReason || 'Failed'}
                        </span>
                      ) : tx.status === 'completed' ? (
                        <span className="success-text">Settled</span>
                      ) : (
                        <span className="dim-text">Disbursement in progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <div className="modal-icon-badge">
                  <ArrowDownToLine size={20} />
                </div>
                <div>
                  <h3>Confirm M-Pesa Withdrawal</h3>
                  <p className="modal-subtitle">Instant B2C payout to your phone</p>
                </div>
              </div>
              <button className="close-btn" onClick={handleCloseModal} disabled={submitting}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="withdrawal-form">
              {/* Balance Indicator Banner */}
              <div className="available-banner">
                <span>Available to withdraw:</span>
                <strong>KSh {Number(summary.availableBalance || 0).toLocaleString()}</strong>
              </div>

              {/* Amount Input */}
              <div className="form-group">
                <label htmlFor="withdrawAmount">Amount (KSh)</label>
                <div className="input-wrapper">
                  <span className="currency-prefix">KSh</span>
                  <input
                    id="withdrawAmount"
                    type="number"
                    min="10"
                    max={summary.availableBalance}
                    step="1"
                    placeholder="e.g. 500"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
                {/* Quick Presets */}
                <div className="preset-buttons">
                  {[100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="preset-btn"
                      onClick={() => setWithdrawAmount(String(amt))}
                      disabled={submitting || summary.availableBalance < amt}
                    >
                      KSh {amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="preset-btn max"
                    onClick={() => setWithdrawAmount(String(Math.floor(summary.availableBalance)))}
                    disabled={submitting || summary.availableBalance < 10}
                  >
                    All (KSh {Math.floor(summary.availableBalance)})
                  </button>
                </div>
              </div>

              {/* M-Pesa Phone Input */}
              <div className="form-group">
                <label htmlFor="withdrawPhone">M-Pesa Phone Number</label>
                <div className="input-wrapper">
                  <Smartphone size={18} className="input-icon" />
                  <input
                    id="withdrawPhone"
                    type="tel"
                    placeholder="07XXXXXXXX or 01XXXXXXXX"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
                <p className="field-hint">The money will be sent directly to this M-Pesa registered number.</p>
              </div>

              {/* Feedback Message Alert */}
              {feedback && (
                <div className={`feedback-alert ${feedback.type}`}>
                  {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Security Note */}
              <div className="security-note">
                <ShieldCheck size={16} />
                <span>Encrypted & processed directly by Safaricom Daraja B2C.</span>
              </div>

              {/* Submit Buttons */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="confirm-withdraw-btn"
                  disabled={submitting || !withdrawAmount || Number(withdrawAmount) < 10}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="spinning" />
                      <span>Sending to M-Pesa...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Withdraw</span>
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderEarnings;
