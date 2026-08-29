import {useState, useEffect, Fragment} from 'react';
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

  const getOrderSubtotal = () => (order?.items || []).reduce((sum, item) => sum + getOrderItemPrice(item), 0);
  const getOrderDiscount = () => {
    const subtotal = getOrderSubtotal();
    const deliveryFee = Number(order?.deliveryFee || 0);
    const finalTotal = Number(order?.totalPrice || 0);
    return Math.max(0, subtotal + deliveryFee - finalTotal);
  };

  const getStatusBadgeLabel = (status) => {
    const normalized = (status || 'pending').toLowerCase();
    if (['delivered', 'completed', 'ready'].includes(normalized)) return 'Delivered';
    if (['confirmed', 'processing'].includes(normalized)) return 'Confirmed';
    if (['preparing'].includes(normalized)) return 'Preparing';
    if (['on-delivery', 'out-for-delivery', 'assigned'].includes(normalized)) return 'On Delivery';
    if (['cancelled'].includes(normalized)) return 'Cancelled';
    return 'Pending';
  };

  const getStatusBadgeClassName = (status) => {
    const normalized = (status || 'pending').toLowerCase();
    if (['delivered', 'completed', 'ready'].includes(normalized)) return 'status-badge success';
    if (['confirmed', 'processing'].includes(normalized)) return 'status-badge info';
    if (['preparing'].includes(normalized)) return 'status-badge warning';
    if (['on-delivery', 'out-for-delivery', 'assigned'].includes(normalized)) return 'status-badge primary';
    if (['cancelled'].includes(normalized)) return 'status-badge danger';
    return 'status-badge neutral';
  };

  const formatDateTime = (value) => {
    if (!value) return 'Not available';
    try {
      const formatted = new Date(value);
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(formatted);
    } catch (error) {
      return 'Not available';
    }
  };

  const restaurantNames = (order?.restaurants || []).map((rest) => rest?.name).filter(Boolean);
  const subtotal = getOrderSubtotal();
  const discountAmount = getOrderDiscount();
  const deliveryFee = Number(order?.deliveryFee || 0);
  const finalTotal = Number(order?.totalPrice || 0);

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
          <div className="order-modal-header">
            <div>
              <p className="eyebrow-text">Order overview</p>
              <h3>#{String(order?._id || '').slice(-8).toUpperCase()}</h3>
            </div>
            <span className={getStatusBadgeClassName(formData.status)}>{getStatusBadgeLabel(formData.status)}</span>
          </div>

          <div className="details-panel-group">
            <div className="detail-card order-meta-card">
              <div className="section-heading-row">
                <h4>Order Information</h4>
              </div>
              <div className="info-list compact-list">
                <div className="info-row"><span>Order ID</span><strong>{order?._id || 'N/A'}</strong></div>
                <div className="info-row"><span>Placed</span><strong>{formatDateTime(order?.createdAt)}</strong></div>
                <div className="info-row"><span>Status</span><strong>{order?.status || 'pending'}</strong></div>
              </div>
            </div>

            <div className="detail-card">
              <div className="section-heading-row">
                <h4>Customer Information</h4>
              </div>
              <div className="info-list compact-list">
                <div className="info-row"><span>Name</span><strong>{order?.customerName || order?.customer?.name || 'N/A'}</strong></div>
                <div className="info-row"><span>Phone</span><strong>{order?.guestPhone || order?.whatsappNumber || 'N/A'}</strong></div>
                <div className="info-row"><span>Email</span><strong>{order?.guestEmail || 'N/A'}</strong></div>
                <div className="info-row address-row"><span>Address</span><strong>{order?.deliveryAddress || 'Not provided'}</strong></div>
              </div>
            </div>

            <div className="detail-card">
              <div className="section-heading-row">
                <h4>Restaurant Information</h4>
              </div>
              <div className="info-list compact-list">
                <div className="info-row"><span>Restaurant</span><strong>{restaurantNames.length > 0 ? restaurantNames.join(', ') : 'N/A'}</strong></div>
                <div className="info-row"><span>Assigned rider</span><strong>{order?.riderId?.name || order?.riderName || 'Not assigned'}</strong></div>
                <div className="info-row"><span>Delivery status</span><strong>{order?.deliveryStatus || 'Pending'}</strong></div>
              </div>
            </div>

            <div className="detail-card full-width">
              <div className="section-heading-row">
                <h4>Ordered Items</h4>
              </div>
              <div className="item-table-wrap">
                <table className="item-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order?.items || []).length > 0 ? (
                      order.items.map((item, index) => {
                        const isCombo = Boolean(item?.isCombination);
                        const unitPrice = Number(item?.price ?? item?.unitPrice ?? 0);
                        const total = getOrderItemPrice(item);
                        const comboChildren = Array.isArray(item?.components) ? item.components : [];
                        return (
                          <Fragment key={`${item?._id || item?.foodId || item?.name || index}`}>
                            <tr className={isCombo ? 'item-row-parent' : ''}>
                              <td>
                                <div className="item-name-cell">
                                  <span className={isCombo ? 'combo-parent-name' : ''}>{getOrderItemName(item)}</span>
                                  {isCombo && <small className="combo-badge">Combo</small>}
                                </div>
                              </td>
                              <td>{item?.quantity || 1}</td>
                              <td>{formatCurrency(unitPrice)}</td>
                              <td>{formatCurrency(total)}</td>
                            </tr>
                            {isCombo && comboChildren.length > 0 && comboChildren.map((component, compIndex) => (
                              <tr key={`${item?._id || item?.foodId || item?.name || index}-child-${compIndex}`} className="item-row-child">
                                <td>
                                  <div className="combo-child-name">{component?.name || component?.foodId?.name || 'Item'} </div>
                                </td>
                                <td>{Number(component?.quantity || 0) * Number(item?.quantity || 1)}</td>
                                <td>{formatCurrency(Number(component?.price || 0))}</td>
                                <td>{formatCurrency(Number(component?.price || 0) * Number(component?.quantity || 0) * Number(item?.quantity || 1))}</td>
                              </tr>
                            ))}
                          </Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="empty-table-cell">No items recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="detail-card">
              <div className="section-heading-row">
                <h4>Delivery Information</h4>
              </div>
              <div className="info-list compact-list">
                <div className="info-row"><span>Delivery fee</span><strong>{Number(order?.deliveryFee || 0) === 0 ? 'Free' : formatCurrency(order?.deliveryFee || 0)}</strong></div>
                <div className="info-row"><span>Rider</span><strong>{order?.riderId?.name || order?.riderName || 'Not assigned'}</strong></div>
                <div className="info-row"><span>Instructions</span><strong>{order?.specialInstructions || 'None'}</strong></div>
              </div>
            </div>

            <div className="detail-card">
              <div className="section-heading-row">
                <h4>Payment & Summary</h4>
              </div>
              <div className="summary-list">
                <div className="summary-row"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
                <div className="summary-row"><span>Delivery fee</span><strong>{Number(deliveryFee) === 0 ? 'Free' : formatCurrency(deliveryFee)}</strong></div>
                <div className="summary-row"><span>VAT</span><strong>{formatCurrency(Number(order?.vat ?? order?.tax ?? 5))}</strong></div>
                <div className="summary-row"><span>Rider tip</span><strong>{formatCurrency(Number(order?.riderTip || 0))}</strong></div>
                <div className="summary-row"><span>Discount</span><strong>{formatCurrency(discountAmount)}</strong></div>
                <div className="summary-divider"></div>
                <div className="summary-row total-row"><span>Total</span><strong>{formatCurrency(finalTotal)}</strong></div>
                <div className="info-row"><span>Payment method</span><strong>{order?.paymentMethod?.toUpperCase() || 'MPESA'}</strong></div>
                <div className="info-row"><span>Payment status</span><strong>{order?.paymentStatus || 'Pending'}</strong></div>
                <div className="info-row"><span>Receipt</span><strong>{order?.mpesaReceiptNumber || 'Not provided'}</strong></div>
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
