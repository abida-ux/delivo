import { useState, useEffect } from 'react';
import AdminMarketplaceLayout from '../../../layouts/AdminMarketplaceLayout';
import { getMarketplaceOrders } from '../../../services/api';
import '../AdminMarketplace.css';

export default function AdminMarketplaceCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomersFromOrders();
  }, []);

  const fetchCustomersFromOrders = async () => {
    try {
      setLoading(true);
      const orders = await getMarketplaceOrders().catch(() => []);
      if (orders && orders.length > 0) {
        // Aggregate customer stats from real orders
        const customerMap = {};
        orders.forEach((o) => {
          const email = o.customerEmail || 'customer@delivo.com';
          if (!customerMap[email]) {
            customerMap[email] = {
              name: o.customerName || 'Delivo Customer',
              email,
              phone: o.customerPhone || 'N/A',
              ordersCount: 0,
              totalSpent: 0,
            };
          }
          customerMap[email].ordersCount += 1;
          customerMap[email].totalSpent += Number(o.totalAmount || 0);
        });
        setCustomers(Object.values(customerMap));
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminMarketplaceLayout pageTitle="Marketplace Customers">
      <div className="admin-mkt-container" style={{ padding: 0 }}>
        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">Marketplace Customers ({customers.length})</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>Loading customer data...</div>
          ) : customers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>No customer accounts or orders recorded yet.</div>
          ) : (
            <table className="admin-mkt-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={i}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>{c.ordersCount} orders</td>
                    <td>KES {c.totalSpent.toLocaleString()}</td>
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
