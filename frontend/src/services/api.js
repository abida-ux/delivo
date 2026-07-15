import axios from 'axios';

// Determine API URL based on environment
const PRODUCTION_API_URL = 'https://delivo-d5r8.onrender.com/api';

const getAPIUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (import.meta.env.PROD) {
    return PRODUCTION_API_URL;
  }

  return '/api';
};

const API_BASE_URL = getAPIUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

let foodsCache = null;
let foodsPromise = null;

const getCachedFoods = () => {
  try {
    const cached = sessionStorage.getItem('delivo_foods_cache');
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const setCachedFoods = (data) => {
  try {
    sessionStorage.setItem('delivo_foods_cache', JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
};

// ================= TOKEN ATTACHMENT (IMPORTANT) =================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// ================= RESTAURANTS =================
export const getAllRestaurants = async () => {
  const res = await api.get('/restaurants');
  return res.data.data || [];
};

export const getRestaurantById = async (id) => {
  const res = await api.get(`/restaurants/${id}`);
  return res.data.data;
};


// ================= FOODS =================
export const getAllFoods = async () => {
  const cached = getCachedFoods();
  if (cached) {
    foodsCache = cached;
    return cached;
  }

  if (foodsCache) {
    return foodsCache;
  }

  if (foodsPromise) {
    return foodsPromise;
  }

  foodsPromise = api.get('/foods')
    .then((res) => {
      const data = res.data.data || [];
      foodsCache = data;
      setCachedFoods(data);
      return data;
    })
    .catch((error) => {
      foodsPromise = null;
      throw error;
    });

  return foodsPromise;
};

export const getFoodsByRestaurant = async (restaurantId) => {
  const res = await api.get('/foods', {
    params: { restaurantId },
  });
  return res.data.data || [];
};


// ================= ORDERS =================
export const createOrder = async (orderData) => {
  const res = await api.post('/orders', orderData);
  return res.data.data;
};

export const getAppSettings = async () => {
  const res = await api.get('/settings');
  return res.data.data || {};
};

export const updateAppSettings = async (settings) => {
  const res = await api.put('/settings', settings);
  return res.data.data;
};

export const getUserOrders = async (userId) => {
  const res = await api.get(`/orders/user/${userId}`);
  return res.data.data || [];
};

export const getOrderById = async (orderId) => {
  const res = await api.get(`/orders/${orderId}`);
  return res.data.data;
};

export const getAllOrders = async () => {
  const res = await api.get('/orders');
  return res.data.data || [];
};


// ================= AUTH (FIXED) =================
export const loginUser = async (data) => {
  const res = await api.post('/users/login', data);
  return res.data;
};

export const registerUser = async (data) => {
  const res = await api.post('/users/register', data);
  return res.data;
};

export const verifyEmail = async (data) => {
  const res = await api.post('/users/verify-email', data);
  return res.data;
};

export const resendVerificationCode = async (data) => {
  const res = await api.post('/users/resend-verification-code', data);
  return res.data;
};

export const createUser = async (data) => {
  const res = await api.post('/users', data);
  return res.data;
};

// ================= ADMIN FUNCTIONS =================
export const getAllUsers = async () => {
  const res = await api.get('/users');
  return res.data.data || [];
};

export const getUserById = async (id) => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};

// ================= RESTAURANTS =================
export const updateOrder = async (id, data) => {
  const res = await api.put(`/orders/${id}`, data);
  return res.data;
};

export const deleteFood = async (id) => {
  const res = await api.delete(`/foods/${id}`);
  return res.data;
};

export const updateFood = async (id, data) => {
  const res = await api.put(`/foods/${id}`, data);
  return res.data;
};

export const createFood = async (data) => {
  const res = await api.post('/foods', data);
  return res.data;
};

export const updateRestaurant = async (id, data) => {
  const res = await api.put(`/restaurants/${id}`, data);
  return res.data;
};

export const createRestaurant = async (data) => {
  const res = await api.post('/restaurants', data);
  return res.data;
};

export const deleteRestaurant = async (id) => {
  const res = await api.delete(`/restaurants/${id}`);
  return res.data;
};

// ================= STORE TYPES =================
export const getAllStoreTypes = async () => {
  const res = await api.get('/stores/types');
  return res.data.data || [];
};

export const getStoreType = async (id) => {
  const res = await api.get(`/stores/types/${id}`);
  return res.data.data;
};

export const createStoreType = async (data) => {
  const res = await api.post('/stores/types', data);
  return res.data.data;
};

export const updateStoreType = async (id, data) => {
  const res = await api.put(`/stores/types/${id}`, data);
  return res.data.data;
};

export const deleteStoreType = async (id) => {
  const res = await api.delete(`/stores/types/${id}`);
  return res.data;
};

// ================= STORES =================
export const getAllStores = async (storeTypeId = null) => {
  const params = storeTypeId ? { storeTypeId } : {};
  const res = await api.get('/stores', { params });
  return res.data.data || [];
};

export const getStoreById = async (id) => {
  const res = await api.get(`/stores/${id}`);
  return res.data.data;
};

export const createStore = async (data) => {
  const res = await api.post('/stores', data);
  return res.data.data;
};

export const updateStore = async (id, data) => {
  const res = await api.put(`/stores/${id}`, data);
  return res.data.data;
};

export const deleteStore = async (id) => {
  const res = await api.delete(`/stores/${id}`);
  return res.data;
};

export const addProductToStore = async (data) => {
  const res = await api.post('/stores/product/add', data);
  return res.data.data;
};

export const removeProductFromStore = async (data) => {
  const res = await api.post('/stores/product/remove', data);
  return res.data.data;
};

// ================= EXPORT UTILITIES =================
export { getAPIUrl };

export default api;