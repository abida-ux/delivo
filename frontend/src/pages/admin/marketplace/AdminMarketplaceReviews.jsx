import { useState, useEffect } from 'react';
import AdminMarketplaceLayout from '../../../layouts/AdminMarketplaceLayout';
import {
  getMarketplaceReviews,
  updateMarketplaceReview,
  deleteMarketplaceReview,
} from '../../../services/api';
import { MessageSquare, Trash2 } from 'lucide-react';
import '../AdminMarketplace.css';

export default function AdminMarketplaceReviews() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const data = await getMarketplaceReviews();
      setReviews(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id, status) => {
    await updateMarketplaceReview(id, { status });
    fetchReviews();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete review?')) {
      await deleteMarketplaceReview(id);
      fetchReviews();
    }
  };

  return (
    <AdminMarketplaceLayout pageTitle="Product Reviews Moderation">
      <div className="admin-mkt-container" style={{ padding: 0 }}>
        <div className="admin-mkt-card">
          <h3 className="admin-mkt-card-title">Product Reviews Moderation ({reviews.length})</h3>
          <table className="admin-mkt-table">
            <thead>
              <tr>
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td>⭐ {r.rating} / 5</td>
                  <td>{r.comment}</td>
                  <td><span className="admin-mkt-status-badge badge-pending">{r.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="admin-mkt-btn-primary" style={{ padding: '6px 12px' }} onClick={() => handleStatusChange(r._id, 'approved')}>Approve</button>
                      <button className="admin-mkt-btn-danger" onClick={() => handleStatusChange(r._id, 'rejected')}>Reject</button>
                      <button className="admin-mkt-btn-danger" onClick={() => handleDelete(r._id)}><Trash2 size={14} /></button>
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
