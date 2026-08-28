/**
 * Utility functions for production-safe browser storage (localStorage / sessionStorage) handling.
 * Prevents application crashes from malformed JSON, corrupted structures, unexpected data types, or storage exceptions.
 */

export const CART_STORAGE_VERSION = 1;

/**
 * Safely read a raw key from browser storage.
 */
export const safeGetItem = (key, storage = typeof window !== 'undefined' ? window.localStorage : null) => {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (error) {
    console.warn(`[storageUtils] Failed to read key "${key}" from storage:`, error);
    return null;
  }
};

/**
 * Safely set a raw key in browser storage.
 */
export const safeSetItem = (key, value, storage = typeof window !== 'undefined' ? window.localStorage : null) => {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[storageUtils] Failed to write key "${key}" to storage:`, error);
    return false;
  }
};

/**
 * Safely remove a key from browser storage.
 */
export const safeRemoveItem = (key, storage = typeof window !== 'undefined' ? window.localStorage : null) => {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[storageUtils] Failed to remove key "${key}" from storage:`, error);
    return false;
  }
};

/**
 * Safely parse a JSON string into an object or fallback value.
 */
export const safeParseJson = (jsonString, fallback = null) => {
  if (!jsonString || typeof jsonString !== 'string') return fallback;
  try {
    const parsed = JSON.parse(jsonString);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (error) {
    console.warn('[storageUtils] Failed to parse JSON string:', error);
    return fallback;
  }
};

/**
 * Sanitize a single cart item to ensure it has all required properties and valid data types.
 */
export const sanitizeCartItem = (item) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return null;
  }

  // Extract primary identifier
  const foodId = item.foodId && typeof item.foodId === 'object' ? item.foodId._id : item.foodId;
  const marketplaceProductId = item.marketplaceProductId;
  const rawId = foodId || marketplaceProductId || item._id || item.id;

  if (!rawId || (typeof rawId !== 'string' && typeof rawId !== 'number')) {
    return null; // Item is missing a valid identifier
  }

  const itemId = String(rawId).trim();
  if (!itemId) return null;

  // Determine product type
  const productType =
    item.productType === 'marketplace' || item.categoryType === 'marketplace' || marketplaceProductId
      ? 'marketplace'
      : 'meal';

  // Normalize quantity
  const rawQty = parseInt(item.quantity, 10);
  const quantity = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1;

  // Normalize price
  const rawPrice = Number(item.price);
  const price = Number.isFinite(rawPrice) && rawPrice >= 0 ? rawPrice : 0;

  // Normalize name
  const name = item.name && typeof item.name === 'string' ? item.name.trim() : 'Unnamed Item';

  // Normalize restaurant reference
  let restaurantId = null;
  let restaurantName = null;

  if (item.restaurantId) {
    restaurantId = typeof item.restaurantId === 'object' ? item.restaurantId._id : item.restaurantId;
    restaurantName = item.restaurantName || (typeof item.restaurantId === 'object' ? item.restaurantId.name : null);
  } else if (item.restaurant) {
    if (typeof item.restaurant === 'object' && item.restaurant._id) {
      restaurantId = item.restaurant._id;
      restaurantName = item.restaurant.name;
    } else if (typeof item.restaurant === 'string') {
      restaurantId = item.restaurant;
      restaurantName = item.restaurantName || null;
    }
  }

  if (restaurantId) {
    restaurantId = String(restaurantId);
  }

  return {
    ...item,
    productType,
    foodId: productType === 'marketplace' ? undefined : itemId,
    marketplaceProductId: productType === 'marketplace' ? itemId : undefined,
    _id: item._id || itemId,
    restaurantId: restaurantId || null,
    restaurantName: restaurantName || null,
    name,
    portionName: item.portionName || item.selectedVariation || null,
    price,
    quantity,
    image: item.image || item.images?.[0] || '',
    categoryType: item.categoryType || (productType === 'marketplace' ? 'marketplace' : 'meal'),
    isCombination: !!item.isCombination,
    combinationId: item.isCombination ? item.combinationId || itemId : undefined,
    components: Array.isArray(item.components) ? item.components : undefined,
  };
};

/**
 * Sanitize an array of cart items, repairing valid items and filtering out completely corrupted ones.
 */
export const sanitizeCartItems = (rawItems) => {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  const sanitized = [];
  for (const item of rawItems) {
    const cleaned = sanitizeCartItem(item);
    if (cleaned) {
      sanitized.push(cleaned);
    }
  }

  return sanitized;
};

/**
 * Safely load and validate cart data from storage, handling version envelopes and legacy raw arrays.
 */
export const loadSanitizedCart = (key, storage = typeof window !== 'undefined' ? window.localStorage : null) => {
  const rawString = safeGetItem(key, storage);
  if (!rawString) {
    return [];
  }

  const parsed = safeParseJson(rawString, null);
  if (!parsed) {
    // Malformed JSON stored under key -> remove invalid entry
    safeRemoveItem(key, storage);
    return [];
  }

  let itemsToSanitize = [];

  // Version envelope: { version: 1, data: [...] }
  if (typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.data)) {
    itemsToSanitize = parsed.data;
  } else if (Array.isArray(parsed)) {
    // Legacy un-versioned raw array format
    itemsToSanitize = parsed;
  } else {
    // Stored value is non-array object or primitive -> remove invalid entry
    safeRemoveItem(key, storage);
    return [];
  }

  const sanitized = sanitizeCartItems(itemsToSanitize);

  // If data was repaired or converted from legacy format, re-save in standard versioned format
  if (sanitized.length > 0) {
    saveSanitizedCart(key, sanitized, storage);
  } else {
    safeRemoveItem(key, storage);
  }

  return sanitized;
};

/**
 * Safely save sanitized cart items to storage with versioning metadata.
 */
export const saveSanitizedCart = (
  key,
  cartItems,
  storage = typeof window !== 'undefined' ? window.localStorage : null
) => {
  const sanitized = sanitizeCartItems(cartItems);

  if (sanitized.length === 0) {
    safeRemoveItem(key, storage);
    return [];
  }

  const payload = {
    version: CART_STORAGE_VERSION,
    updatedAt: Date.now(),
    data: sanitized,
  };

  const jsonString = JSON.stringify(payload);
  safeSetItem(key, jsonString, storage);
  return sanitized;
};
