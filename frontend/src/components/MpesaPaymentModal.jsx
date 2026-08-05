import { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import './MpesaPaymentModal.css';

export default function MpesaPaymentModal({
  isOpen,
  status = 'pending', // 'pending' | 'success' | 'failed'
  message = '',
  amount = 0,
  orderId = '',
  onClose,
  onRetry,
}) {
  const [typedLogo, setTypedLogo] = useState('');
  const fullText = 'DELIVO';

  // Letter-by-letter typewriter animation loop for DELIVO
  useEffect(() => {
    if (!isOpen || status !== 'pending') return;

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % (fullText.length + 1);
      setTypedLogo(fullText.slice(0, index));
    }, 220);

    return () => clearInterval(interval);
  }, [isOpen, status]);

  if (!isOpen) return null;

  return (
    <div className="mpesa-modal-overlay">
      <div className="mpesa-modal-card">
        
        {/* PENDING / WAITING STATE */}
        {status === 'pending' && (
          <div className="mpesa-modal-content">
            <div className="mpesa-phone-icon-wrapper">
              <div className="mpesa-radar-pulse"></div>
              <div className="mpesa-radar-pulse outer"></div>
              <Smartphone size={34} className="mpesa-phone-icon" />
            </div>

            {/* Glowing Typewriter DELIVO Logo */}
            <div className="mpesa-logo-typewriter">
              {fullText.split('').map((char, i) => (
                <span
                  key={i}
                  className={`typewriter-char ${i < typedLogo.length ? 'active' : ''}`}
                >
                  {char}
                </span>
              ))}
              <span className="typewriter-cursor">|</span>
            </div>

            <h3 className="mpesa-modal-title">Waiting for M-Pesa Confirmation</h3>
            
            <p className="mpesa-modal-subtext">
              An M-Pesa STK prompt has been sent to your phone. Please check your screen and enter your <strong>M-Pesa PIN</strong> to confirm payment.
            </p>

            {amount > 0 && (
              <div className="mpesa-amount-badge">
                Amount: <strong>KES {Number(amount).toFixed(2)}</strong>
              </div>
            )}

            <div className="mpesa-loading-bar-container">
              <div className="mpesa-loading-bar-fill"></div>
            </div>

            <p className="mpesa-status-hint">
              <Loader2 size={13} className="spin-icon" style={{ display: 'inline', marginRight: '6px' }} />
              {message || 'Verifying transaction with Safaricom M-Pesa...'}
            </p>
          </div>
        )}

        {/* SUCCESS / PAYMENT RECEIVED STATE */}
        {(status === 'success' || status === 'completed') && (
          <div className="mpesa-modal-content mpesa-success-content">
            <div className="mpesa-check-circle-wrapper">
              <div className="mpesa-success-pulse-ring"></div>
              <CheckCircle size={68} className="mpesa-check-icon" />
            </div>

            <h3 className="mpesa-modal-title mpesa-success-title">Payment Confirmed!</h3>
            
            <p className="mpesa-modal-subtext">
              Money received successfully! {orderId ? `Order #${orderId}` : 'Your order'} is being prepared.
            </p>

            <div className="mpesa-success-badge">
              <span>Paid: KES {Number(amount).toFixed(2)}</span>
            </div>

            <div className="mpesa-redirect-notice">
              <div className="redirect-dots">
                <span></span><span></span><span></span>
              </div>
              <p>Redirecting to your Orders page...</p>
            </div>
          </div>
        )}

        {/* FAILED STATE */}
        {status === 'failed' && (
          <div className="mpesa-modal-content mpesa-failed-content">
            <div className="mpesa-fail-circle-wrapper">
              <XCircle size={58} className="mpesa-fail-icon" />
            </div>

            <h3 className="mpesa-modal-title mpesa-failed-title">Payment Failed</h3>
            
            <p className="mpesa-modal-subtext">
              {message || 'The M-Pesa transaction was cancelled or timed out. Please try again.'}
            </p>

            <div className="mpesa-failed-actions">
              {onRetry && (
                <button type="button" className="mpesa-retry-btn" onClick={onRetry}>
                  <RefreshCw size={16} />
                  <span>Try Again</span>
                </button>
              )}
              <button type="button" className="mpesa-close-btn" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
