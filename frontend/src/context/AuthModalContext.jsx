import { createContext, useState } from 'react';

export const AuthModalContext = createContext();

export const AuthModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  // ✅ ONLY HANDLES MODAL VISIBILITY - NO AUTH LOGIC HERE
  const openLoginModal = () => {
    setAuthMode('login');
    setIsOpen(true);
  };

  const openSignupModal = () => {
    setAuthMode('signup');
    setIsOpen(true);
  };

  const toggleMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        authMode,
        openLoginModal,
        openSignupModal,
        toggleMode,
        closeModal,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};
