import {createContext, useContext, useState} from 'react';

const CartUIContext = createContext();

export const CartUIProvider = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(prev => !prev);

  const openCheckout = () => setIsCheckoutOpen(true);
  const closeCheckout = () => setIsCheckoutOpen(false);

  const value = {
    isCartOpen,
    setIsCartOpen,
    openCart,
    closeCart,
    toggleCart,
    isCheckoutOpen,
    setIsCheckoutOpen,
    openCheckout,
    closeCheckout,
  };

  return (
    <CartUIContext.Provider value={value}>
      {children}
    </CartUIContext.Provider>
  );
};

export const useCartUI = () => {
  const context = useContext(CartUIContext);
  if (!context) {
    throw new Error('useCartUI must be used within CartUIProvider');
  }
  return context;
};

export default CartUIContext;
