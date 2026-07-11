import { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // ✅ ADD LOADING STATE

  // ✅ LOAD AUTH FROM STORAGE ON MOUNT
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (err) {
        console.error('Failed to parse saved auth:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    }
    setIsLoading(false); // ✅ DONE LOADING
  }, []);

  // ✅ LOGIN - SINGLE SOURCE OF TRUTH
  // Stores user + token in localStorage AND React state
  const login = (userData, authToken) => {
    console.log('🔵 AuthContext.login() called');
    console.log('   user:', JSON.stringify(userData));
    console.log('   token:', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    setUser(userData);
    setToken(authToken);
    console.log('✅ User set to:', userData);
  };

  // ✅ LOGOUT - CLEAR AUTH ONLY (NOT CART)
  // Cart items should persist per user in localStorage
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  // 🔵 DEBUG: Log localStorage and useEffect
  useEffect(() => {
    console.log('🔄 AuthContext mounted/updated');
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    console.log('   localStorage.user:', savedUser ? 'EXISTS' : 'EMPTY');
    console.log('   localStorage.token:', savedToken ? 'EXISTS' : 'EMPTY');
    console.log('   Current state - user:', user);
  }, [user]);

  // ✅ DERIVED STATE - NO DUPLICATE BOOLEAN
  // isAuthenticated is derived from user state (single source of truth)
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading, // ✅ ADD LOADING STATE
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
