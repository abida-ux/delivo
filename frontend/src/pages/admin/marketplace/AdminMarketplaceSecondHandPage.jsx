import { useState, useEffect } from 'react';
import AdminMarketplaceLayout from '../../../layouts/AdminMarketplaceLayout';
import {
  getSecondHandListings,
  updateSecondHandListing,
  deleteSecondHandListing,
} from '../../../services/api';
import { Tag, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import '../AdminMarketplace.css';

export default function AdminMarketplaceSecondHandPage() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const data = await getSecondHandListings();
      setListings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id, approvalStatus) => {
    await updateSecondHandListing(id, { approvalStatus });
    fetchListings();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this listing?')) {
      await deleteSecondHandListing(id);
      fetchListings();
    }
  };

  return (
    <AdminMarketplaceLayout pageTitle="Second-Hand Pre-Owned Management">
      <div className="admin-mkt-container" style={{ padding: 0 }}>
        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">Pre-Owned Items Approval Queue ({listings.length})</h3>
          <table className="admin-mkt-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Condition</th>
                <th>Price</th>
                <th>Seller</th>
                <th>Approval Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((item) => (
                <tr key={item._id}>
                  <td><strong>{item.productName}</strong><br /><span style={{ fontSize: 11, color: '#64748b' }}>{item.location}</span></td>
                  <td><span className="admin-mkt-status-badge badge-pending">{item.condition}</span></td>
                  <td>KES {Number(item.price).toLocaleString()}</td>
                  <td>{item.seller} ({item.sellerContact || 'N/A'})</td>
                  <td>
                    <span className={`admin-mkt-status-badge ${item.approvalStatus === 'approved' ? 'badge-approved' : item.approvalStatus === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                      {item.approvalStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="admin-mkt-btn-primary" style={{ padding: '6px 12px' }} onClick={() => handleStatusChange(item._id, 'approved')}>
                        Approve
                      </button>
                      <button className="admin-mkt-btn-danger" onClick={() => handleStatusChange(item._id, 'rejected')}>
                        Reject
                      </button>
                      <button className="admin-mkt-btn-danger" onClick={() => handleDelete(item._id)}>
                        <Trash2 size={14} />
                      </button>
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
