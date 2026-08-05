import { createContext, useContext, useState, useEffect } from 'react';

const MarketplaceCartContext = createContext();

const MARKETPLACE_CART_KEY = 'delivo_marketplace_cart_v1';

export const MarketplaceCartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(MARKETPLACE_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(MARKETPLACE_CART_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save marketplace cart to storage', e);
    }
  }, [cartItems]);

  const addItem = (product, quantity = 1) => {
    setCartItems((prev) => {
      const productId = product._id || product.id;
      const existingIndex = prev.findIndex((item) => (item._id || item.id) === productId);

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { ...product, quantity }];
      }
    });
  };

  const removeItem = (productId) => {
    setCartItems((prev) => prev.filter((item) => (item._id || item.id) !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        (item._id || item.id) === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.finalPrice || item.price) || 0) * item.quantity,
    0
  );

  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const openMarketplaceCart = () => setIsCartOpen(true);
  const closeMarketplaceCart = () => setIsCartOpen(false);

  return (
    <MarketplaceCartContext.Provider
      value={{
        cartItems,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        cartTotal,
        totalItemCount,
        isCartOpen,
        openMarketplaceCart,
        closeMarketplaceCart,
      }}
    >
      {children}
    </MarketplaceCartContext.Provider>
  );
};

export const useMarketplaceCart = () => {
  const context = useContext(MarketplaceCartContext);
  if (!context) {
    throw new Error('useMarketplaceCart must be used within a MarketplaceCartProvider');
  }
  return context;
};
