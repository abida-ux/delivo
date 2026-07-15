import { useState, useContext, useEffect, useRef } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Phone } from 'lucide-react';
import { registerUser, verifyEmail, resendVerificationCode } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { AuthModalContext } from '../../context/AuthModalContext';
import './Auth.css';

const Signup = ({ isModal = false }) => {
  const navigate = useNavigate();
  const { closeModal, openLoginModal } = useContext(AuthModalContext);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const otpInputRef = useRef(null);
  const isSubmittingRef = useRef(false);

  const emptyForm = {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (isModal) {
      setFormData(emptyForm);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowVerification(false);
      setVerificationEmail('');
      setOtp('');
      setError('');
      setVerifyMessage('');
    }
  }, [isModal]);

  useEffect(() => {
    if (showVerification && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [showVerification]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      setLoading(true);
      const { confirmPassword, ...payload } = formData;
      const startedAt = Date.now();

      sessionStorage.setItem('pendingVerificationEmail', payload.email);
      setVerificationEmail(payload.email);
      setVerificationSuccess(false);
      setVerifyMessage('Preparing your verification code...');
      setOtp('');
      setError('');

      const res = await registerUser(payload);
      const elapsed = Date.now() - startedAt;
      const remainingDelay = Math.max(0, 1000 - elapsed);

      if (remainingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }

      setShowVerification(true);
      const fallbackCode = res?.verificationCode ? ` Verification code: ${res.verificationCode}` : '';
      setVerifyMessage((res?.message || 'Account created. Enter the 6-digit code sent to your email to finish verification.') + fallbackCode);
      setFormData((prev) => ({ ...emptyForm, email: payload.email }));
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 0);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Signup failed';
      if (errorMsg.toLowerCase().includes('already exists') || errorMsg.toLowerCase().includes('user already exists')) {
        setVerificationEmail(formData.email);
        setShowVerification(true);
        setVerifyMessage('An account with this email already exists. Please enter the verification code sent to your email.');
        setOtp('');
        setError('');
      } else {
        setShowVerification(false);
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verificationEmail || !otp) {
      setError('Email and verification code are required');
      return;
    }

    try {
      setVerifyLoading(true);
      await verifyEmail({ email: verificationEmail, code: otp });
      sessionStorage.removeItem('pendingVerificationEmail');
      setOtp('');
      setError('');

      if (isModal) {
        closeModal();
        openLoginModal();
      } else {
        navigate('/login');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Verification failed';
      setError(errorMsg);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    if (!verificationEmail) return;

    try {
      setResendLoading(true);
      const res = await resendVerificationCode({ email: verificationEmail });
      const fallbackCode = res?.verificationCode ? ` Verification code: ${res.verificationCode}` : '';
      setVerifyMessage((res?.message || 'A new verification code was sent.') + fallbackCode);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Could not resend code';
      setError(errorMsg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className={`auth-container ${isModal ? 'modal-mode' : ''}`}>
      {!isModal && <h1 className="auth-page-title">Create Account</h1>}

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #ef5350',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#c62828',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {verificationSuccess ? (
        <div className="verification-success-card">
          <div className="verification-success-icon">✓</div>
          <h3>Account created successfully</h3>
          <p>Your account is now verified and ready to use.</p>
          <button type="button" className="auth-submit-btn" onClick={() => {
            if (isModal) {
              openLoginModal();
            } else {
              navigate('/login');
            }
          }}>
            Go to Login
          </button>
        </div>
      ) : verifyLoading ? (
        <div className="verification-progress-card">
          <div className="verification-spinner" aria-label="Loading" />
          <h3>Verifying your account</h3>
          <p>Please wait while we confirm your code.</p>
        </div>
      ) : !showVerification ? (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="input-wrapper">
              <Phone size={18} className="input-icon" />
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((p) => !p)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      ) : (
        <div className="verify-section">
          <p className="verify-message">{verifyMessage}</p>
          <form onSubmit={handleVerifySubmit} className="verify-form">
            <div className="form-group">
              <label htmlFor="verification-email">Email</label>
              <input
                id="verification-email"
                name="verification-email"
                value={verificationEmail}
                readOnly
                className="verify-readonly"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-otp">Verification Code</label>
              <input
                ref={otpInputRef}
                id="signup-otp"
                name="signup-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                required
              />
            </div>

            <div className="verify-actions">
              <button type="submit" className="auth-submit-btn" disabled={verifyLoading}>
                {verifyLoading ? 'Verifying...' : 'Verify Email'}
              </button>
              <button type="button" className="auth-link-btn" onClick={handleResend} disabled={resendLoading}>
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Signup;