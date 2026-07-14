import { useState, useContext, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Phone } from 'lucide-react';
import { registerUser } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { AuthModalContext } from '../../context/AuthModalContext';
import './Auth.css';

const Signup = ({ isModal = false }) => {
  const navigate = useNavigate();

  // Use AuthModalContext only to close modal
  const { closeModal } = useContext(AuthModalContext);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emptyForm = {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };

  const [formData, setFormData] = useState(emptyForm);

  // reset form every time modal opens
  useEffect(() => {
    if (isModal) {
      setFormData(emptyForm);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isModal]);

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
      setLoading(true);

      const { confirmPassword, ...payload } = formData;

      // ✅ CALL API
      const res = await registerUser(payload);

      console.log('SIGNUP RESPONSE:', res);

      if (isModal && closeModal) {
        closeModal();
      }

      setFormData(emptyForm);
      setError('');

      setTimeout(() => {
        navigate('/verify-email', { state: { email: payload.email } });
      }, 300);

    } catch (err) {
      console.log('SIGNUP ERROR:', err);
      const errorMsg = err.response?.data?.message || 'Signup failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
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

      <form onSubmit={handleSubmit} className="auth-form">

        {/* NAME */}
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

        {/* EMAIL */}
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

        {/* PHONE */}
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

        {/* PASSWORD */}
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

        {/* CONFIRM PASSWORD */}
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

        {/* SUBMIT */}
        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

      </form>
    </div>
  );
};

export default Signup;