import { useState, useContext, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { AuthModalContext } from '../../context/AuthModalContext';
import './Auth.css';

const Login = ({ isModal = false }) => {
  const navigate = useNavigate();

  // Use AuthContext for login (SINGLE SOURCE OF TRUTH)
  const { login } = useContext(AuthContext);
  // Use AuthModalContext only to close modal
  const { closeModal } = useContext(AuthModalContext);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const emptyForm = {
    email: '',
    password: '',
  };

  const [formData, setFormData] = useState(emptyForm);

  // Reset form every time modal opens
  useEffect(() => {
    if (isModal) {
      setFormData(emptyForm);
      setShowPassword(false);
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

    try {
      setLoading(true);

      // Call API login endpoint
      const res = await loginUser(formData);
      console.log('📡 API Response:', JSON.stringify(res));

      // Store user and token in AuthContext (which persists to localStorage)
      login(res.user, res.token);

      console.log('✅ LOGIN SUCCESS - User:', res.user?.email, 'Role:', res.user?.role);

      // Close modal if opened from navbar
      if (isModal) {
        closeModal();
      }

      // Reset form
      setFormData(emptyForm);

      // Navigate based on user role
      setTimeout(() => {
        if (res.user?.role === 'admin') {
          navigate('/admin');
        } else if (res.user?.role === 'restaurant') {
          navigate('/restaurant-dashboard');
        } else if (res.user?.role === 'rider') {
          navigate('/rider-dashboard');
        } else {
          navigate('/');
        }
      }, 500);

    } catch (err) {
      console.error('LOGIN ERROR:', err);
      alert(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={`auth-container ${isModal ? 'modal-mode' : ''}`}>
      {!isModal && <h1 className="auth-page-title">Welcome Back</h1>}

      <form onSubmit={handleSubmit} className="auth-form">

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
              autoComplete="off"
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
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
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

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>

      </form>

      {!isModal && (
        <p className="auth-footer">
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      )}
    </div>
  );
};

export default Login;