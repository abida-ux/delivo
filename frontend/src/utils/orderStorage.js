const GUEST_ORDERS_KEY = 'delivo_guest_orders';

const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }

  return null;
};

export const getGuestOrders = () => {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(GUEST_ORDERS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Unable to read guest orders from storage:', error);
    return [];
  }
};

export const saveGuestOrder = (order) => {
  if (!order?._id) return getGuestOrders();

  const storage = getStorage();
  if (!storage) return getGuestOrders();

  const existing = getGuestOrders().filter((item) => item._id !== order._id);
  const nextOrders = [order, ...existing].slice(0, 10);

  try {
    storage.setItem(GUEST_ORDERS_KEY, JSON.stringify(nextOrders));
  } catch (error) {
    console.warn('Unable to save guest order to storage:', error);
  }

  return nextOrders;
};

export const getGuestOrderById = (orderId) => {
  if (!orderId) return null;
  return getGuestOrders().find((order) => order._id === orderId) || null;
};

export const clearGuestOrders = () => {
  const storage = getStorage();
  if (!storage) return;

  storage.removeItem(GUEST_ORDERS_KEY);
};
