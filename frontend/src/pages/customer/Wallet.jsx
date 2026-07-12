import React, { useState } from 'react';
import { Wallet, Plus, Send, History, Eye, EyeOff, CreditCard } from 'lucide-react';
import '../pages.css';
import './Wallet.css';

const WalletPage = () => {
  const [balance, setBalance] = useState(125.50);
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: 'credit',
      description: 'Order refund',
      amount: 35.99,
      date: '2024-05-20',
      time: '18:30'
    },
    {
      id: 2,
      type: 'debit',
      description: 'Food delivery payment',
      amount: -42.50,
      date: '2024-05-21',
      time: '19:15'
    },
    {
      id: 3,
      type: 'credit',
      description: 'Loyalty reward',
      amount: 10.00,
      date: '2024-05-19',
      time: '14:20'
    },
    {
      id: 4,
      type: 'debit',
      description: 'Order payment',
      amount: -28.99,
      date: '2024-05-18',
      time: '20:00'
    }
  ]);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  const handleAddMoney = () => {
    if (addAmount && parseFloat(addAmount) > 0) {
      setBalance(balance + parseFloat(addAmount));
      setTransactions([
        {
          id: transactions.length + 1,
          type: 'credit',
          description: 'Money added to wallet',
          amount: parseFloat(addAmount),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString()
        },
        ...transactions
      ]);
      setAddAmount('');
      setShowAddMoney(false);
    }
  };

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h1>My Wallet</h1>
        <p>Manage your balance and transactions</p>
      </div>

      <div className="wallet-card">
        <div className="wallet-top">
          <div className="balance-info">
            <p className="balance-label">Wallet Balance</p>
            <div className="balance-display">
              <h2 className="balance-amount">
                {showBalance ? `KES ${balance.toFixed(2)}` : '••••••'}
              </h2>
              <button 
                className="toggle-balance-btn"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <Wallet size={40} className="wallet-icon" />
        </div>

        <div className="wallet-actions">
          <button 
            className="action-btn add-money"
            onClick={() => setShowAddMoney(!showAddMoney)}
          >
            <Plus size={20} />
            Add Money
          </button>
          <button className="action-btn send-money">
            <Send size={20} />
            Send
          </button>
          <button className="action-btn payment-method">
            <CreditCard size={20} />
            Payments
          </button>
        </div>

        {showAddMoney && (
          <div className="add-money-form">
            <input
              type="number"
              placeholder="Enter amount"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              step="0.01"
              min="0"
            />
            <div className="quick-amounts">
              <button onClick={() => setAddAmount('10')}>KES 10</button>
              <button onClick={() => setAddAmount('25')}>KES 25</button>
              <button onClick={() => setAddAmount('50')}>KES 50</button>
              <button onClick={() => setAddAmount('100')}>KES 100</button>
            </div>
            <button 
              className="proceed-btn"
              onClick={handleAddMoney}
              disabled={!addAmount}
            >
              Add KES {addAmount || '0'}
            </button>
          </div>
        )}
      </div>

      <div className="transactions-section">
        <div className="section-header">
          <h2>Transaction History</h2>
          <History size={20} />
        </div>

        <div className="transactions-list">
          {transactions.map((tx) => (
            <div key={tx.id} className="transaction-item">
              <div className="tx-icon" style={{
                backgroundColor: tx.type === 'credit' ? '#dbeafe' : '#fecaca',
                color: tx.type === 'credit' ? '#0369a1' : '#dc2626'
              }}>
                {tx.type === 'credit' ? '+' : '−'}
              </div>
              <div className="tx-info">
                <p className="tx-description">{tx.description}</p>
                <p className="tx-time">{tx.date} at {tx.time}</p>
              </div>
              <p className="tx-amount" style={{
                color: tx.type === 'credit' ? '#22c55e' : '#ef4444'
              }}>
                {tx.type === 'credit' ? '+' : '-'}KES {Math.abs(tx.amount).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
