import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail, resendVerificationCode } from '../../services/api';
import './Auth.css';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
const DEFAULT_EXPIRY_SECONDS = 10 * 60;

const createEmptyOtp = () => Array(OTP_LENGTH).fill('');

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const mins = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const secs = String(safeSeconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef([]);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(createEmptyOtp());
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [expiresIn, setExpiresIn] = useState(DEFAULT_EXPIRY_SECONDS);
  const [verificationExpired, setVerificationExpired] = useState(false);

  useEffect(() => {
    const emailFromState = location.state?.email || '';
    const emailFromQuery = new URLSearchParams(location.search).get('email') || '';
    const storedEmail = sessionStorage.getItem('pendingVerificationEmail') || '';
    const resolvedEmail = emailFromState || emailFromQuery || storedEmail;

    if (resolvedEmail) {
      setEmail(resolvedEmail);
      sessionStorage.setItem('pendingVerificationEmail', resolvedEmail);
    }

    const expiresAt = Number(location.state?.expiresAt || 0);
    const initialExpiresIn = expiresAt > 0
      ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      : DEFAULT_EXPIRY_SECONDS;

    setExpiresIn(initialExpiresIn);
    setVerificationExpired(initialExpiresIn <= 0);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }, [location.search, location.state]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (verificationExpired) return;

    const timer = window.setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          setVerificationExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [verificationExpired]);

  useEffect(() => {
    if (email && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      const previousOtp = [...otp];
      previousOtp[index - 1] = '';
      setOtp(previousOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pastedValue = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);

    if (!pastedValue) return;

    const nextOtp = createEmptyOtp();
    pastedValue.split('').forEach((digit, index) => {
      nextOtp[index] = digit;
    });

    setOtp(nextOtp);
    const targetIndex = Math.min(pastedValue.length, OTP_LENGTH - 1);
    inputRefs.current[targetIndex]?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Email is missing. Please return to registration and try again.');
      return;
    }

    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    if (verificationExpired) {
      setError('Your verification code has expired. Please request a new code.');
      return;
    }

    try {
      setLoading(true);
      const res = await verifyEmail({ email, code });
      setMessage(res.message || 'Email verified successfully.');
      sessionStorage.removeItem('pendingVerificationEmail');
      window.setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const backendMessage = err.response?.data?.message || 'Verification failed.';
      setError(backendMessage === 'Verification code has expired'
        ? 'Your verification code has expired. Please request a new code.'
        : backendMessage === 'Invalid verification code'
          ? 'Invalid verification code.'
          : backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0 || loading) return;

    setError('');
    setMessage('');

    try {
      setLoading(true);
      await resendVerificationCode({ email });
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setVerificationExpired(false);
      setExpiresIn(DEFAULT_EXPIRY_SECONDS);
      setMessage('A new verification code was sent to your email.');
    } catch (err) {
      const backendMessage = err.response?.data?.message || 'Could not resend code.';
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container verify-email-page">
      <h1 className="auth-page-title">Verify Your Email</h1>
      <p className="auth-subtitle">
        Enter the 6-digit verification code sent to your email address.
      </p>

      {message && <div className="auth-message success">{message}</div>}
      {error && <div className="auth-message error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <div className="input-wrapper">
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Verification Code</label>
          <div className="otp-input-group" role="group" aria-label="Verification code">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength="1"
                value={digit}
                onChange={(event) => handleOtpChange(index, event.target.value)}
                onKeyDown={(event) => handleOtpKeyDown(index, event)}
                onPaste={index === 0 ? handleOtpPaste : undefined}
                className="otp-input"
                aria-label={`Digit ${index + 1}`}
                autoFocus={index === 0}
              />
            ))}
          </div>
        </div>

        <div className="auth-meta-row">
          <span className="auth-meta-text">
            {verificationExpired ? 'Verification code expired.' : `Code expires in: ${formatTime(expiresIn)}`}
          </span>
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading || verificationExpired || otp.join('').length !== OTP_LENGTH}
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <button
        type="button"
        className="auth-submit-btn secondary"
        onClick={handleResend}
        disabled={loading || resendCooldown > 0 || !email}
      >
        {loading ? 'Sending...' : 'Resend Code'}
      </button>

      {resendCooldown > 0 && (
        <p className="auth-hint">
          You can request another code in: {formatTime(resendCooldown)}
        </p>
      )}
    </div>
  );
};

export default VerifyEmail;
