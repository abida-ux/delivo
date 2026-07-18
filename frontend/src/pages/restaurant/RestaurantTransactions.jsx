import React, { useEffect, useState } from 'react';
import './RestaurantDashboard.css';

const RestaurantTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/restaurant/transactions', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setTransactions(json?.data || []);
    };
    load();
  }, []);

  return (
    <div className="restaurant-shell">
      <div className="restaurant-header glass-card"><div><h1>Transactions</h1><p>Ledger of credits, debits, and balances</p></div></div>
      <div className="panel glass-card">{transactions.length === 0 ? <div className="empty-state">No transactions yet.</div> : <table className="table"><thead><tr><th>Description</th><th>Credit</th><th>Debit</th><th>Balance</th></tr></thead><tbody>{transactions.map((tx, index) => <tr key={`${tx.description}-${index}`} className="table-row"><td>{tx.description}</td><td>{tx.credit}</td><td>{tx.debit}</td><td>{tx.balance}</td></tr>)}</tbody></table>}</div>
    </div>
  );
};

export default RestaurantTransactions;
