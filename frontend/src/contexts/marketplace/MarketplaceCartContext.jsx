import { createContext, useContext, useState, useEffect } from 'react';
import { loadSanitizedCart, saveSanitizedCart, sanitizeCartItems } from '../../utils/storageUtils';

const MarketplaceCartContext = createContext();

const MARKETPLACE_CART_KEY = 'delivo_marketplace_cart_v1';

export const MarketplaceCartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      return loadSanitizedCart(MARKETPLACE_CART_KEY);
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      saveSanitizedCart(MARKETPLACE_CART_KEY, cartItems);
    } catch (e) {
      console.error('Failed to save marketplace cart to storage', e);
    }
  }, [cartItems]);

  const addItem = (product, quantity = 1) => {
    setCartItems((prev) => {
      const currentList = Array.isArray(prev) ? prev : [];
      const productId = product?._id || product?.id || product?.marketplaceProductId;
      if (!productId) return currentList;

      const existingIndex = currentList.findIndex((item) => (item._id || item.id || item.marketplaceProductId) === productId);

      let updated;
      if (existingIndex > -1) {
        updated = [...currentList];
        const currentQty = Number.isFinite(Number(updated[existingIndex].quantity)) ? Number(updated[existingIndex].quantity) : 1;
        updated[existingIndex].quantity = currentQty + quantity;
      } else {
        updated = [...currentList, { ...product, quantity }];
      }
      return sanitizeCartItems(updated);
    });
  };

  const removeItem = (productId) => {
    setCartItems((prev) => {
      const currentList = Array.isArray(prev) ? prev : [];
      return sanitizeCartItems(currentList.filter((item) => (item._id || item.id || item.marketplaceProductId) !== productId));
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    setCartItems((prev) => {
      const currentList = Array.isArray(prev) ? prev : [];
      const updated = currentList.map((item) =>
        (item._id || item.id || item.marketplaceProductId) === productId ? { ...item, quantity: newQuantity } : item
      );
      return sanitizeCartItems(updated);
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

  const cartTotal = safeCartItems.reduce((sum, item) => {
    if (!item) return sum;
    const price = Number(item.finalPrice ?? item.price ?? 0);
    const qty = Number(item.quantity || 0);
    return sum + (Number.isFinite(price) && price >= 0 ? price : 0) * (Number.isFinite(qty) && qty >= 0 ? qty : 0);
  }, 0);

  const totalItemCount = safeCartItems.reduce((sum, item) => {
    if (!item) return sum;
    const qty = Number(item.quantity || 0);
    return sum + (Number.isFinite(qty) && qty >= 0 ? qty : 0);
  }, 0);

  const openMarketplaceCart = () => setIsCartOpen(true);
  const closeMarketplaceCart = () => setIsCartOpen(false);

  return (
    <MarketplaceCartContext.Provider
      value={{
        cartItems: safeCartItems,
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

