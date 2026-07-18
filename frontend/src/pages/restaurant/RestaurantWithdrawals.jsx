import React, { useState } from 'react';
import './RestaurantDashboard.css';

const RestaurantWithdrawals = () => {
  const [form, setForm] = useState({ amount: '', bankName: '', accountNumber: '', mpesaNumber: '' });
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/restaurant/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ amount: Number(form.amount) }) });
    const json = await res.json();
    setMessage(json.message || 'Request submitted');
  };

  return (
    <div className="restaurant-shell">
      <div className="restaurant-header glass-card"><div><h1>Withdrawals</h1><p>Request a payout to your admin-approved account</p></div></div>
      <div className="content-grid">
        <div className="panel glass-card">
          <form className="restaurant-form" onSubmit={submit}>
            <input placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <input placeholder="Bank Name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
            <input placeholder="Account Number" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
            <input placeholder="M-Pesa Number" value={form.mpesaNumber} onChange={(e) => setForm({ ...form, mpesaNumber: e.target.value })} />
            <div className="button-row"><button className="btn-primary" type="submit">Submit Withdrawal</button></div>
            {message && <p>{message}</p>}
          </form>
        </div>
        <div className="panel glass-card"><div className="empty-state">Withdrawal requests are submitted to admin for approval.</div></div>
      </div>
    </div>
  );
};

export default RestaurantWithdrawals;
