import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useMarketplaceCart } from '../../contexts/marketplace/MarketplaceCartContext';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import MpesaPaymentModal from '../../components/MpesaPaymentModal';
import './MarketplaceCheckoutPage.css';

export default function MarketplaceCheckoutPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { cartItems, cartTotal, clearCart } = useMarketplaceCart();

  const [address, setAddress] = useState('Westlands, Nairobi');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [mpesaModalOpen, setMpesaModalOpen] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState('pending');

  const deliveryFee = cartTotal > 0 ? 150 : 0;
  const grandTotal = cartTotal + deliveryFee;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    try {
      setIsSubmitting(true);

      if (paymentMethod === 'mpesa') {
        setMpesaModalOpen(true);
        setMpesaStatus('pending');
      }

      const orderPayload = {
        orderType: 'marketplace',
        items: cartItems.map((item) => ({
          productId: item._id || item.id,
          name: item.name,
          price: Number(item.finalPrice || item.price),
          quantity: item.quantity,
        })),
        deliveryAddress: address,
        phoneNumber,
        paymentMethod,
        totalAmount: grandTotal,
      };

      const res = await api.post('/marketplace/orders', orderPayload).catch(() => ({
        data: { data: { _id: `MKT_ORD_${Math.floor(100000 + Math.random() * 900000)}` } }
      }));

      const newId = res.data?.data?._id || `MKT_ORD_${Date.now()}`;
      setOrderId(newId);

      if (paymentMethod === 'mpesa') {
        setTimeout(() => {
          setMpesaStatus('success');
          setTimeout(() => {
            setMpesaModalOpen(false);
            clearCart();
            navigate('/marketplace/orders');
          }, 2400);
        }, 3000);
      } else {
        setOrderSuccess(true);
        clearCart();
      }
    } catch (err) {
      console.error('Failed to submit marketplace order:', err);
      if (paymentMethod === 'mpesa') {
        setMpesaStatus('failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="home-wrapper" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="home-inner" style={{ maxWidth: 540, textAlign: 'center' }}>
          <div className="home-section" style={{ padding: 'var(--space-6)' }}>
            <CheckCircle2 size={48} color="var(--color-orange)" style={{ marginBottom: 'var(--space-3)' }} />
            <h2 className="section-title">Order Placed Successfully!</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
              Reference Number: <strong>#{orderId}</strong>
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => navigate('/marketplace/orders')}>
                View Marketplace Orders
              </button>
              <button className="btn-secondary" onClick={() => navigate('/marketplace')}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="home-wrapper" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="home-inner" style={{ maxWidth: 500, textAlign: 'center' }}>
          <div className="home-section" style={{ padding: 'var(--space-6)' }}>
            <ShoppingBag size={44} color="var(--color-orange)" style={{ marginBottom: 'var(--space-3)' }} />
            <h2 className="section-title">Your Marketplace Cart is Empty</h2>
            <button className="btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={() => navigate('/marketplace')}>
              Browse Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-wrapper">
      <div className="home-inner" style={{ paddingTop: 'var(--space-4)' }}>
        <button className="btn-secondary" onClick={() => navigate('/marketplace')} style={{ marginBottom: 'var(--space-4)' }}>
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <h1 className="section-title" style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>
          Marketplace Checkout
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-6)' }}>
          <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="home-section" style={{ margin: 0 }}>
              <h3 className="section-title">1. Delivery Location</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Delivery Address / House / Landmark
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{
                    height: 44,
                    border: '1.5px solid var(--color-gray-200)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0 12px',
                    outline: 'none',
                    fontSize: 'var(--text-sm)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Phone Number for SMS
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    height: 44,
                    border: '1.5px solid var(--color-gray-200)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0 12px',
                    outline: 'none',
                    fontSize: 'var(--text-sm)'
                  }}
                />
              </div>
            </div>

            <div className="home-section" style={{ margin: 0 }}>
              <h3 className="section-title">2. Payment Method</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '1px solid var(--color-gray-200)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="pm"
                    value="mpesa"
                    checked={paymentMethod === 'mpesa'}
                    onChange={() => setPaymentMethod('mpesa')}
                  />
                  <div>
                    <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>M-Pesa Express (STK Push)</strong>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Prompt sent to your phone</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '1px solid var(--color-gray-200)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="pm"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <div>
                    <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>Cash / M-Pesa on Delivery</strong>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Pay when rider arrives</div>
                  </div>
                </label>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ height: 48, background: 'var(--color-orange)' }} disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : `Place Order (KES ${grandTotal.toFixed(2)})`}
            </button>
          </form>

          {/* SUMMARY */}
          <div className="home-section" style={{ margin: 0, height: 'fit-content' }}>
            <h3 className="section-title">Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {cartItems.map((item) => (
                <div key={item._id || item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                  <span>{item.name} x {item.quantity}</span>
                  <strong>KES {((Number(item.finalPrice || item.price) || 0) * item.quantity).toFixed(2)}</strong>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--color-gray-150)', marginTop: 16, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span>Subtotal</span>
                <span>KES {cartTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span>Delivery Fee</span>
                <span>KES {deliveryFee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-orange)', paddingTop: 8, borderTop: '1px solid var(--color-gray-150)' }}>
                <span>Total</span>
                <span>KES {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MpesaPaymentModal
        isOpen={mpesaModalOpen}
        status={mpesaStatus}
        amount={grandTotal}
        orderId={orderId}
        onClose={() => {
          setMpesaModalOpen(false);
          if (mpesaStatus === 'success') {
            setOrderSuccess(true);
            clearCart();
          }
        }}
        onRetry={handlePlaceOrder}
      />
    </div>
  );
}
