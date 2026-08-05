import { useEffect, useState, useContext } from 'react';
import AdminMarketplaceLayout from '../../layouts/AdminMarketplaceLayout';
import { AuthContext } from '../../context/AuthContext';
import {
  getMarketplaceAdminOverview,
  getMarketplaceOrders,
} from '../../services/api';
import {
  Package,
  Layers,
  Store,
  ShoppingCart,
  Tag,
  Calendar,
} from 'lucide-react';
import '../pages.css';
import './AdminDashboard.css';
import './AdminMarketplace.css';

export default function AdminMarketplace() {
  const { user } = useContext(AuthContext);
  const [overview, setOverview] = useState({ categories: 0, products: 0, stores: 0, orders: 0, secondHandPending: 0, banners: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, ordersData] = await Promise.all([
        getMarketplaceAdminOverview().catch(() => ({})),
        getMarketplaceOrders().catch(() => []),
      ]);
      if (overviewData) setOverview(overviewData);
      if (Array.isArray(ordersData)) setRecentOrders(ordersData);
    } catch (err) {
      console.error('Error loading marketplace dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const currentFormattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const statCards = [
    {
      label: 'Products',
      value: overview.products || 0,
      icon: Package,
      desc: 'Active catalog items',
    },
    {
      label: 'Categories',
      value: overview.categories || 0,
      icon: Layers,
      desc: 'Marketplace categories',
    },
    {
      label: 'Stores',
      value: overview.stores || 0,
      icon: Store,
      desc: 'Verified merchants',
    },
    {
      label: 'Second-Hand',
      value: overview.secondHandPending || 0,
      icon: Tag,
      desc: 'Pending pre-owned reviews',
    },
    {
      label: 'Orders',
      value: overview.orders || recentOrders.length || 0,
      icon: ShoppingCart,
      desc: 'Total marketplace orders',
    },
  ];

  return (
    <AdminMarketplaceLayout pageTitle="Dashboard">
      <div className="admin-dashboard-v2">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading marketplace metrics...</p>
          </div>
        ) : (
          <div className="dashboard-grid-container">
            {/* ── WELCOME BANNER SECTION ── */}
            <div className="welcome-banner">
              <div className="welcome-text">
                <h2>{greeting}, {user?.name || 'Admin'} 👋</h2>
                <p>Here's what's happening across Delivo Marketplace today.</p>
              </div>
              <div className="welcome-date">
                <Calendar size={14} />
                <span>{currentFormattedDate}</span>
              </div>
            </div>

            {/* ── KPI CARDS GRID ── */}
            <div className="layout-row-two">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="v2-stat-card">
                    <div className="v2-stat-header">
                      <div className="v2-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                        <Icon size={20} />
                      </div>
                    </div>
                    <div className="v2-stat-body">
                      <span className="v2-label">{stat.label}</span>
                      <h4 className="v2-value">{stat.value}</h4>
                    </div>
                    <p className="v2-desc">{stat.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* ── RECENT MARKETPLACE TRANSACTIONS TABLE ── */}
            <div className="layout-row-three">
              <div className="large-table-card">
                <div className="table-card-header">
                  <div className="header-left">
                    <h3>Recent Marketplace Orders</h3>
                    <p>Live marketplace checkout stream logs</p>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="stripe-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.length > 0 ? (
                        recentOrders.map((o) => (
                          <tr key={o._id}>
                            <td className="font-mono text-xs">#{o.orderNumber || o._id.slice(-6).toUpperCase()}</td>
                            <td>{o.customerName || 'Customer'}</td>
                            <td className="font-semibold">KES {Number(o.totalAmount || 0).toLocaleString()}</td>
                            <td>
                              <span className={`badge ${o.status === 'delivered' || o.status === 'paid' ? 'badge-success' : o.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                                {(o.status || 'pending').toUpperCase()}
                              </span>
                            </td>
                            <td>{new Date(o.createdAt || Date.now()).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                            No marketplace orders recorded in the database yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminMarketplaceLayout>
  );
}
