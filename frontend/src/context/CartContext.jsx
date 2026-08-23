import { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import api from '../services/api';

const CartContext = createContext();
const GUEST_CART_KEY = 'delivo_guest_cart';

export const CartProvider = ({ children }) => {
  const { user, token, isLoading: authLoading } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper to reliably extract food ID string across guest and backend objects
  const getNormalizedFoodId = (item) => {
    if (!item) return null;
    if (item.productType === 'marketplace') {
      return item.marketplaceProductId || item.foodId || item._id;
    }
    return typeof item.foodId === 'object' && item.foodId !== null ? item.foodId._id : item.foodId;
  };

  // Helper to get item restaurant ID string
  const getNormalizedRestaurantId = (item) => {
    if (!item || !item.restaurantId) return null;
    return typeof item.restaurantId === 'object' ? item.restaurantId._id : item.restaurantId;
  };

  // Load guest cart from localStorage only when the user is not signed in
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

  // Persist the current cart locally when the user is signed out
  useEffect(() => {
    if (authLoading) return;
    if (user && token) return;

    if (cartItems.length > 0) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
    }
  }, [cartItems, user, token, authLoading]);

  // Fetch cart from database when user logs in, and clear cart when user logs out
  useEffect(() => {
    if (authLoading) return;
    
    if (user && token) {
      console.log('👤 User logged in, syncing cart with database...');
      fetchCartFromDatabase();
    } else {
      console.log('👤 User logged out, clearing state & guest cart...');
      setCartItems([]);
      localStorage.removeItem(GUEST_CART_KEY);
    }
  }, [user?._id, token, authLoading]);

  // Fetch cart from backend database and merge with guest cart if exists
  const fetchCartFromDatabase = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      let dbCartItems = data.cart?.items || [];

      // Check if there's a guest cart to merge
      const guestCart = localStorage.getItem(GUEST_CART_KEY);
      if (guestCart) {
        try {
          const guestItems = JSON.parse(guestCart);
          if (guestItems.length > 0) {
            console.log(`📦 Found guest cart with ${guestItems.length} items, merging via /cart/merge...`);
            const mergeRes = await api.post('/cart/merge', { items: guestItems });
            dbCartItems = mergeRes.data.cart?.items || [];
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

  // Add item to cart (works for both authenticated and guest users)
  const addItem = async (food, quantity = 1, explicitRestaurant = null) => {
    const productType = food?.productType === 'marketplace' || food?.categoryType === 'marketplace' || food?.marketplaceProductId ? 'marketplace' : 'meal';
    const itemId = food?._id || food?.marketplaceProductId || food?.foodId || food?.id;

    if (!itemId) {
      throw new Error('This item is missing an identifier and could not be added to the cart.');
    }

    let initialRestaurantId = null;
    let initialRestaurantName = null;
    let initialPrice = null;

    if (productType === 'marketplace') {
      initialPrice = Number(food?.finalPrice ?? food?.price ?? 0);
    } else if (explicitRestaurant) {
      initialRestaurantId = explicitRestaurant._id || explicitRestaurant.restaurantId || explicitRestaurant.id;
      initialRestaurantName = explicitRestaurant.name || explicitRestaurant.restaurantName;
      initialPrice = explicitRestaurant.price !== undefined ? Number(explicitRestaurant.price) : Number(food.price || 0);
    } else {
      // Resolve restaurant from food object (string ID, object, or array)
      if (food.restaurantId) {
        initialRestaurantId = typeof food.restaurantId === 'object' ? food.restaurantId._id : food.restaurantId;
        initialRestaurantName = food.restaurantName || (typeof food.restaurantId === 'object' ? food.restaurantId.name : null);
      } else if (food.restaurant) {
        if (typeof food.restaurant === 'object' && food.restaurant._id) {
          initialRestaurantId = food.restaurant._id;
          initialRestaurantName = food.restaurant.name;
        } else if (typeof food.restaurant === 'string') {
          initialRestaurantId = food.restaurant;
          initialRestaurantName = food.restaurantName || null;
        }
      } else if (Array.isArray(food.restaurants) && food.restaurants.length > 0) {
        const firstRest = food.restaurants[0];
        if (typeof firstRest === 'object' && firstRest._id) {
          initialRestaurantId = firstRest._id;
          initialRestaurantName = firstRest.name;
        } else if (typeof firstRest === 'string') {
          initialRestaurantId = firstRest;
        }
      }

      if (!initialRestaurantName && food.restaurantName) {
        initialRestaurantName = food.restaurantName;
      }

      initialPrice = food.price !== undefined && food.price !== null ? Number(food.price) : 0;
    }

    const targetPortionName = food.portionName || food.selectedVariation || null;

    const optimisticCart = [...cartItems];
    const existingItem = optimisticCart.find((item) => {
      if (getNormalizedFoodId(item) !== itemId) return false;
      if ((item.productType || 'meal') !== productType) return false;
      if ((item.portionName || null) !== targetPortionName) return false;
      const existingRestId = getNormalizedRestaurantId(item);
      const targetRestId = initialRestaurantId ? initialRestaurantId.toString() : null;
      return existingRestId === targetRestId;
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      if (initialPrice !== null && initialPrice !== undefined) existingItem.price = initialPrice;
    } else {
      optimisticCart.push({
        productType,
        foodId: productType === 'marketplace' ? undefined : itemId,
        marketplaceProductId: productType === 'marketplace' ? itemId : undefined,
        restaurantId: initialRestaurantId || null,
        restaurantName: initialRestaurantName || null,
        name: food.name,
        portionName: targetPortionName,
        price: initialPrice,
        image: food.image || food.images?.[0],
        quantity,
        categoryType: food.categoryType || (productType === 'marketplace' ? 'marketplace' : 'meal'),
        isCombination: !!food.isCombination,
        combinationId: food.isCombination ? itemId : undefined,
        components: food.components || undefined,
      });
    }

    setCartItems(optimisticCart);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(optimisticCart));

    if (user && token) {
      try {
        const { data } = await api.post('/cart/add', {
          foodId: productType === 'meal' ? itemId : undefined,
          marketplaceProductId: productType === 'marketplace' ? itemId : undefined,
          restaurantId: initialRestaurantId || undefined,
          restaurantName: initialRestaurantName || undefined,
          quantity,
          portionName: targetPortionName || undefined,
          productType,
          price: initialPrice !== null ? initialPrice : undefined,
          categoryType: food.categoryType || (productType === 'marketplace' ? 'marketplace' : 'meal'),
          isCombination: !!food.isCombination,
          components: food.components || undefined,
        });

        setCartItems(data.cart?.items || optimisticCart);
        console.log('✅ Item added to account cart:', food.name);
      } catch (error) {
        console.error('❌ Error adding to cart:', error);
        setCartItems(optimisticCart);
      }
      return;
    }

    console.log('✅ Item added to guest cart:', food.name);
  };

  // Update item's chosen restaurant and price
  const updateItemRestaurant = async (foodId, restaurantId, restaurantName, price) => {
    const updated = cartItems.map((item) => {
      if (getNormalizedFoodId(item) === foodId) {
        return {
          ...item,
          restaurantId: restaurantId || null,
          restaurantName: restaurantName || null,
          price: price !== undefined && price !== null ? Number(price) : item.price,
        };
      }
      return item;
    });

    setCartItems(updated);
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updated));

    if (user && token) {
      try {
        const { data } = await api.put('/cart/item-restaurant', {
          foodId,
          restaurantId,
          restaurantName,
          price,
        });
        if (data?.cart?.items) {
          setCartItems(data.cart.items);
        }
      } catch (error) {
        console.error('❌ Error updating cart item restaurant:', error);
      }
    }
  };

  // Remove item from cart (works for both authenticated and guest users)
  const removeItem = async (foodId) => {
    try {
      if (user && token) {
        setCartItems((prevItems) => prevItems.filter((item) => getNormalizedFoodId(item) !== foodId));
        const { data } = await api.delete(`/cart/remove/${foodId}`);
        setCartItems(data.cart?.items || []);
        console.log('🗑️ Item removed from cart');
      } else {
        const updatedCart = cartItems.filter((item) => getNormalizedFoodId(item) !== foodId);
        setCartItems(updatedCart);
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
        console.log('🗑️ Item removed from cart (guest)');
      }
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
    }
  };

  // Update item quantity (works for both authenticated and guest users)
  const updateQuantity = async (foodId, quantity) => {
    if (quantity <= 0) {
      removeItem(foodId);
      return;
    }

    try {
      if (user && token) {
        setCartItems((prevItems) =>
          prevItems.map((item) =>
            getNormalizedFoodId(item) === foodId ? { ...item, quantity } : item
          )
        );

        const { data } = await api.put(`/cart/update/${foodId}`, { quantity });
        setCartItems(data.cart?.items || []);
        console.log('📝 Cart updated in database');
      } else {
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

  // Clear entire cart (works for both authenticated and guest users)
  const clearCart = async () => {
    try {
      if (user && token) {
        await api.delete('/cart/clear');
        setCartItems([]);
        console.log('🧹 Cart cleared in database');
      } else {
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
      const p = item.price !== null && item.price !== undefined ? Number(item.price) : 0;
      return total + p * (item.quantity || 0);
    }, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => {
      return count + (item.quantity || 0);
    }, 0);
  };

  const hasUnassignedItems = () => {
    return false;
  };

  const getUniqueRestaurantCount = () => {
    const ids = new Set();
    cartItems.forEach((item) => {
      if (item.restaurantId) {
        const rId = typeof item.restaurantId === 'object' ? item.restaurantId._id : item.restaurantId;
        if (rId) ids.add(rId.toString());
      }
    });
    return ids.size;
  };

  const value = {
    cartItems,
    loading,
    addItem,
    updateItemRestaurant,
    removeItem,
    updateQuantity,
    clearCart,
    getCartItems,
    getCartTotal,
    getCartItemCount,
    hasUnassignedItems,
    getUniqueRestaurantCount,
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