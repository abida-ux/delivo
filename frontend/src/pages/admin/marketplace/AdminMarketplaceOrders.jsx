import { useState, useEffect } from 'react';
import AdminMarketplaceLayout from '../../../layouts/AdminMarketplaceLayout';
import {
  getMarketplaceOrders,
  updateMarketplaceOrder,
  deleteMarketplaceOrder,
} from '../../../services/api';
import { ShoppingCart, Edit, Trash2 } from 'lucide-react';
import '../AdminMarketplace.css';

export default function AdminMarketplaceOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getMarketplaceOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    await updateMarketplaceOrder(id, { status });
    fetchOrders();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete order record?')) {
      await deleteMarketplaceOrder(id);
      fetchOrders();
    }
  };

  return (
    <AdminMarketplaceLayout pageTitle="Marketplace Orders Management">
      <div className="admin-mkt-container" style={{ padding: 0 }}>
        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">Customer Marketplace Orders ({orders.length})</h3>
          <table className="admin-mkt-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Total Amount</th>
                <th>Payment Status</th>
                <th>Fulfillment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td><strong>{o.orderNumber || o._id.slice(-6).toUpperCase()}</strong></td>
                  <td>{o.customerName || 'Customer'}</td>
                  <td>KES {Number(o.totalAmount || 0).toLocaleString()}</td>
                  <td><span className="admin-mkt-status-badge badge-paid">{o.paymentStatus}</span></td>
                  <td><span className="admin-mkt-status-badge badge-pending">{o.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select value={o.status} onChange={(e) => handleStatusChange(o._id, e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="processing">Processing</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button className="admin-mkt-btn-danger" onClick={() => handleDelete(o._id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminMarketplaceLayout>
  );
}
