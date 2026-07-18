import {createContext, useContext, useState, useEffect} from 'react';
import { AuthContext } from './AuthContext';
import api from '../services/api';

const CartContext = createContext();
const GUEST_CART_KEY = 'delivo_guest_cart';

export const CartProvider = ({ children }) => {
  const { user, token, isLoading: authLoading } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper helper to reliably extract food ID string across guest and backend objects
  const getNormalizedFoodId = (item) => {
    if (!item) return null;
    return typeof item.foodId === 'object' && item.foodId !== null ? item.foodId._id : item.foodId;
  };

  // ✅ Load guest cart from localStorage only when the user is not signed in
  useEffect(() => {
    if (authLoading) return;
    if (user && token) return;

    const guestCart = localStorage.getItem(GUEST_CART_KEY);
    if (guestCart) {
      try {
        setCartItems(JSON.parse(guestCart));
        console.log('📦 Guest cart loaded from localStorage');
      } catch (error) {
        console.error('❌ Error parsing guest cart:', error);
        localStorage.removeItem(GUEST_CART_KEY);
      }
    } else {
      setCartItems([]);
    }
  }, [user, token, authLoading]);

  // ✅ Persist the current cart locally when the user is signed out
  useEffect(() => {
    if (authLoading) return;
    if (user && token) return;

    if (cartItems.length > 0) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
    }
  }, [cartItems, user, token, authLoading]);

  // ✅ Fetch cart from database when user logs in
  useEffect(() => {
    if (authLoading) return;
    
    if (user && token) {
      console.log('👤 User logged in, syncing cart with database...');
      fetchCartFromDatabase();
    }
  }, [user?._id, token, authLoading]);

  // ✅ Fetch cart from backend database and merge with guest cart if exists
  const fetchCartFromDatabase = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      let dbCartItems = data.cart?.items || [];

      // ✅ Check if there's a guest cart to merge
      const guestCart = localStorage.getItem(GUEST_CART_KEY);
      if (guestCart) {
        try {
          const guestItems = JSON.parse(guestCart);
          console.log(`📦 Found guest cart with ${guestItems.length} items, merging with database cart...`);

          // ✅ Merge guest items with database items
          for (const guestItem of guestItems) {
            const guestFoodId = getNormalizedFoodId(guestItem);
            const existingItem = dbCartItems.find((item) => getNormalizedFoodId(item) === guestFoodId);

            if (existingItem) {
              existingItem.quantity += guestItem.quantity;
            } else {
              dbCartItems.push(guestItem);
            }
          }

          // ✅ Clear backend cart before rewriting
          await api.delete('/cart/clear');

          // ✅ Re-add all merged items to database
          for (const item of dbCartItems) {
            const foodId = getNormalizedFoodId(item);
            await api.post('/cart/add', {
              foodId,
              quantity: item.quantity,
            });
          }

          localStorage.removeItem(GUEST_CART_KEY);
          console.log('✅ Guest cart merged and cleared');
        } catch (error) {
          console.error('❌ Error merging guest cart:', error);
        }
      }

      setCartItems(dbCartItems);
      console.log(`✅ Cart loaded from database: ${dbCartItems.length} items`);
    } catch (error) {
      console.error('❌ Error fetching cart from database:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add item to cart (works for both authenticated and guest users)
  const addItem = async (food, quantity = 1) => {
    if (user && token) {
      const optimisticCart = [...cartItems];
      const existingItem = optimisticCart.find(
        (item) => getNormalizedFoodId(item) === food._id
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        optimisticCart.push({
          foodId: food._id,
          name: food.name,
          price: food.price,
          image: food.image,
          quantity,
        });
      }

      setCartItems(optimisticCart);

      try {
        const { data } = await api.post('/cart/add', {
          foodId: food._id,
          quantity,
        });

        setCartItems(data.cart?.items || optimisticCart);
        console.log('✅ Item added to account cart:', food.name);
      } catch (error) {
        console.error('❌ Error adding to cart:', error);
      }
      return;
    }

    const optimisticCart = [...cartItems];
    const existingItem = optimisticCart.find(
      (item) => getNormalizedFoodId(item) === food._id
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      optimisticCart.push({
        foodId: food._id,
        name: food.name,
        price: food.price,
        image: food.image,
        quantity,
      });
    }

    setCartItems(optimisticCart);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(optimisticCart));
    console.log('✅ Item added to guest cart:', food.name);
  };

  // ✅ Remove item from cart (works for both authenticated and guest users)
  const removeItem = async (foodId) => {
    try {
      if (user && token) {
        // Optimistic local state UI update
        setCartItems((prevItems) => prevItems.filter((item) => getNormalizedFoodId(item) !== foodId));

        // ✅ Remove from database for authenticated users
        const { data } = await api.delete(`/cart/remove/${foodId}`);
        setCartItems(data.cart?.items || []);
        console.log('🗑️ Item removed from cart');
      } else {
        // ✅ Remove from localStorage for guest users
        const updatedCart = cartItems.filter((item) => getNormalizedFoodId(item) !== foodId);
        setCartItems(updatedCart);
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
        console.log('🗑️ Item removed from cart (guest)');
      }
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
    }
  };

  // ✅ Update item quantity (works for both authenticated and guest users)
  const updateQuantity = async (foodId, quantity) => {
    if (quantity <= 0) {
      removeItem(foodId);
      return;
    }

    try {
      if (user && token) {
        // ✅ Optimistic UI update: makes interface snap instantly
        setCartItems((prevItems) =>
          prevItems.map((item) =>
            getNormalizedFoodId(item) === foodId ? { ...item, quantity } : item
          )
        );

        // ✅ Update in database for authenticated users
        const { data } = await api.put(`/cart/update/${foodId}`, { quantity });
        setCartItems(data.cart?.items || []);
        console.log('📝 Cart updated in database');
      } else {
        // ✅ Update in localStorage for guest users
        const updatedCart = cartItems.map((item) =>
          getNormalizedFoodId(item) === foodId ? { ...item, quantity } : item
        );
        setCartItems(updatedCart);
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
        console.log('📝 Cart updated (guest)');
      }
    } catch (error) {
      console.error('❌ Error updating cart:', error);
    }
  };

  // ✅ Clear entire cart (works for both authenticated and guest users)
  const clearCart = async () => {
    try {
      if (user && token) {
        // ✅ Clear database for authenticated users
        await api.delete('/cart/clear');
        setCartItems([]);
        console.log('🧹 Cart cleared in database');
      } else {
        // ✅ Clear localStorage for guest users
        setCartItems([]);
        localStorage.removeItem(GUEST_CART_KEY);
        console.log('🧹 Cart cleared (guest)');
      }
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
    }
  };

  const getCartItems = () => {
    return cartItems;
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price || 0) * (item.quantity || 0);
    }, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => {
      return count + (item.quantity || 0);
    }, 0);
  };

  const value = {
    cartItems,
    loading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getCartItems,
    getCartTotal,
    getCartItemCount,
    fetchCart: fetchCartFromDatabase,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export { CartContext };
export default CartContext;