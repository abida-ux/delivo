import axios from 'axios';

// Determine API URL based on environment
const getAPIUrl = () => {
  // Try to get from environment variables first
  if (import.meta.env.VITE_API_URL) {
    console.log('🔧 DEBUG: VITE_API_URL is set to:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback: detect from current domain
  if (typeof window !== 'undefined') {
    console.log('🔧 DEBUG: window.location.hostname =', window.location.hostname);
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    console.log('🔧 DEBUG: isProduction =', isProduction);
    
    if (isProduction) {
      const url = `${window.location.protocol}//${window.location.hostname}/api`;
      console.log('🔧 DEBUG: Using production API:', url);
      return url;
    }
  }
  
  // Development default
  console.log('🔧 DEBUG: Using development API: http://localhost:5000/api');
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getAPIUrl();
console.log('✅ API_BASE_URL set to:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


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
  const res = await api.get('/foods');
  return res.data.data || [];
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