import { useState, useEffect } from 'react';
import AdminMarketplaceLayout from '../../../layouts/AdminMarketplaceLayout';
import { getMarketplaceOrders } from '../../../services/api';
import '../AdminMarketplace.css';

export default function AdminMarketplaceReports() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const data = await getMarketplaceOrders().catch(() => []);
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  return (
    <AdminMarketplaceLayout pageTitle="Analytics & Sales Reports">
      <div className="admin-mkt-container" style={{ padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div className="admin-mkt-card" style={{ marginBottom: 0, padding: '16px' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>TOTAL SALES REVENUE</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', margin: '4px 0 0' }}>KES {totalRevenue.toLocaleString()}</h2>
          </div>
          <div className="admin-mkt-card" style={{ marginBottom: 0, padding: '16px' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>TOTAL FULFILLED ORDERS</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0284c7', margin: '4px 0 0' }}>{totalOrdersCount} Orders</h2>
          </div>
          <div className="admin-mkt-card" style={{ marginBottom: 0, padding: '16px' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>AVERAGE BASKET VALUE</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#059669', margin: '4px 0 0' }}>KES {avgOrderValue.toLocaleString('en-KE', { maximumFractionDigits: 2 })}</h2>
          </div>
        </div>

        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">Order Stream Summary</h3>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>No completed orders to generate analytics yet.</div>
          ) : (
            <table className="admin-mkt-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td><strong>#{o.orderNumber || o._id.slice(-6).toUpperCase()}</strong></td>
                    <td>{o.customerName || 'Customer'}</td>
                    <td>KES {Number(o.totalAmount || 0).toLocaleString()}</td>
                    <td><span className="admin-mkt-status-badge badge-approved">{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminMarketplaceLayout>
  );
}
