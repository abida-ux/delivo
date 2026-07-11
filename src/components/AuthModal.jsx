import { useContext } from 'react';
import { X } from 'lucide-react';
import { AuthModalContext } from '../context/AuthModalContext';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import './AuthModal.css';

const AuthModal = () => {
  const { isOpen, authMode, toggleMode, closeModal } = useContext(AuthModalContext);

  console.log('AuthModal - isOpen:', isOpen, 'authMode:', authMode);

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={closeModal}>
      <div className="auth-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={closeModal}>
          <X size={24} />
        </button>

        <div className="auth-modal-content">
          {authMode === 'login' ? (
            <Login isModal={true} />
          ) : (
            <Signup isModal={true} />
          )}

          <div className="auth-modal-toggle">
            <span>
              {authMode === 'login'
                ? "Don't have an account? "
                : 'Already have an account? '}
            </span>
            <button className="auth-toggle-link" onClick={toggleMode}>
              {authMode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
