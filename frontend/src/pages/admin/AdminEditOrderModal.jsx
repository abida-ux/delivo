import {useState, useEffect} from 'react';
import { X } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import './AdminEditOrderModal.css';

const AdminEditOrderModal = ({ isOpen, order, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    status: 'pending',
    paymentStatus: 'pending',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({
        status: order.status || 'pending',
        paymentStatus: order.paymentStatus || 'pending',
      });
    }
  }, [order]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const resolveOrderFood = (item) => {
    if (!item) return null;
    if (typeof item.foodId === 'object' && item.foodId !== null) return item.foodId;
    if (typeof item.food === 'object' && item.food !== null) return item.food;
    return null;
  };

  const getOrderItemName = (item) => {
    const food = resolveOrderFood(item);
    return food?.name || food?.title || item?.name || item?.foodName || 'Food item';
  };

  const getOrderItemPrice = (item) => {
    const unitPrice = Number(item?.price ?? item?.unitPrice ?? 0);
    const quantity = Number(item?.quantity ?? 1);
    return unitPrice * quantity;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Order Status</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="order-info">
            <p><strong>Order ID:</strong> {order?._id}</p>
            <p><strong>Customer:</strong> {order?.customerName || order?.customer?.name || 'N/A'}</p>
            <p><strong>Total Price:</strong> {formatCurrency(order?.totalPrice || 0)}</p>
          </div>

          <div className="details-grid">
            <div className="detail-card">
              <h3>Delivery</h3>
              <p><strong>Address:</strong> {order?.deliveryAddress || 'Not provided'}</p>
              <p><strong>Instructions:</strong> {order?.specialInstructions || 'None'}</p>
            </div>
            <div className="detail-card">
              <h3>Contact</h3>
              <p><strong>Name:</strong> {order?.customerName || 'Not provided'}</p>
              <p><strong>Phone:</strong> {order?.guestPhone || order?.whatsappNumber || 'Not provided'}</p>
              <p><strong>Email:</strong> {order?.guestEmail || 'Not provided'}</p>
              <p><strong>WhatsApp:</strong> {order?.whatsappNumber || 'Not provided'}</p>
            </div>
            <div className="detail-card">
              <h3>Payment</h3>
              <p><strong>Method:</strong> {order?.paymentMethod?.toUpperCase() || 'MPESA'}</p>
              <p><strong>Status:</strong> {order?.paymentStatus || 'Pending'}</p>
              <p><strong>Receipt:</strong> {order?.mpesaReceiptNumber || 'Not provided'}</p>
            </div>
            <div className="detail-card">
              <h3>Breakdown</h3>
              <p><strong>Items:</strong> {order?.items?.length || 0}</p>
              <p><strong>Delivery Fee:</strong> {formatCurrency(order?.deliveryFee || 0)}</p>
              <p><strong>Tax:</strong> {formatCurrency(order?.tax || 0)}</p>
            </div>
            <div className="detail-card full-width">
              <h3>Food Items</h3>
              <div className="item-list">
                {(order?.items || []).length > 0 ? (
                  order.items.map((item, index) => (
                    <div key={`${item?.foodId || item?.food || index}`} className="item-row">
                      <div>
                        <p className="item-name">{getOrderItemName(item)}</p>
                        <p className="item-meta">Qty: {item?.quantity || 1}</p>
                      </div>
                      <p className="item-total">{formatCurrency(getOrderItemPrice(item))}</p>
                    </div>
                  ))
                ) : (
                  <p className="item-meta">No items recorded</p>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status">Order Status *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="on-delivery">On Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="paymentStatus">Payment Status *</label>
            <select
              id="paymentStatus"
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleChange}
              required
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="status-timeline">
            <div className="timeline-label">Order Progress:</div>
            <div className="timeline">
              <div className={`timeline-step ${['pending', 'confirmed', 'preparing', 'on-delivery', 'delivered'].includes(formData.status) ? 'active' : ''}`}>
                <div className="step-circle">1</div>
                <div className="step-label">Pending</div>
              </div>
              <div className={`timeline-step ${['confirmed', 'preparing', 'on-delivery', 'delivered'].includes(formData.status) ? 'active' : ''}`}>
                <div className="step-circle">2</div>
                <div className="step-label">Confirmed</div>
              </div>
              <div className={`timeline-step ${['preparing', 'on-delivery', 'delivered'].includes(formData.status) ? 'active' : ''}`}>
                <div className="step-circle">3</div>
                <div className="step-label">Preparing</div>
              </div>
              <div className={`timeline-step ${['on-delivery', 'delivered'].includes(formData.status) ? 'active' : ''}`}>
                <div className="step-circle">4</div>
                <div className="step-label">On Delivery</div>
              </div>
              <div className={`timeline-step ${formData.status === 'delivered' ? 'active' : ''}`}>
                <div className="step-circle">5</div>
                <div className="step-label">Delivered</div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Update Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditOrderModal;
