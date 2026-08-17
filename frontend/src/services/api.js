import axios from 'axios';

let foodsCache = null;
let foodsPromise = null;

const PRODUCTION_API_URL = 'https://delivo-d5r8.onrender.com/api';

const getAPIUrl = () => {
  if (import.meta.env.DEV) {
    return '/api';
  }

  const rawUrl = import.meta.env.VITE_API_URL?.trim();
  if (rawUrl) {
    return rawUrl.replace(/\/+$/, '');
  }

  return PRODUCTION_API_URL;
};

const API_BASE_URL = getAPIUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Smart response retry interceptor with exponential backoff
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const shouldRetry = config && (config.method === 'get' || config.retry);
    
    if (!shouldRetry) return Promise.reject(error);
    
    config.__retryCount = config.__retryCount || 0;
    const maxRetries = config.retryLimit || 3;
    
    if (config.__retryCount >= maxRetries) {
      return Promise.reject(error);
    }
    
    // Retry on network errors or 5xx server statuses
    const isRetryable = !error.response || (error.response.status >= 500 && error.response.status <= 599);
    if (!isRetryable) return Promise.reject(error);
    
    config.__retryCount += 1;
    const delay = Math.pow(2, config.__retryCount) * 1000;
    
    console.warn(`⚠️ Axios: Request to ${config.url} failed. Retrying in ${delay}ms... (Attempt ${config.__retryCount}/${maxRetries})`);
    
    await new Promise((resolve) => setTimeout(resolve, delay));
    return api(config);
  }
);



// ================= TOKEN ATTACHMENT (IMPORTANT) =================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// ================= RESTAURANTS =================
const normalizeRestaurantData = (restaurant) => {
  if (!restaurant || typeof restaurant !== 'object') {
    return restaurant;
  }

  return {
    ...restaurant,
    image: restaurant.image || restaurant.bannerImage || restaurant.coverImage || '',
    bannerImage: restaurant.bannerImage || restaurant.image || restaurant.coverImage || '',
  };
};

export const getAllRestaurants = async () => {
  const res = await api.get('/restaurants');
  const data = res.data.data || [];
  return Array.isArray(data) ? data.map(normalizeRestaurantData) : data;
};

export const getRestaurantById = async (id) => {
  const res = await api.get(`/restaurants/${id}`);
  return normalizeRestaurantData(res.data.data);
};


// ================= FOODS =================
export const getAllFoods = async () => {
  if (foodsCache) {
    return foodsCache;
  }

  if (foodsPromise) {
    return foodsPromise;
  }

  foodsPromise = api.get('/foods')
    .then((res) => {
      const data = res.data.data || [];
      foodsCache = Array.isArray(data) ? data : [];
      return foodsCache;
    })
    .catch((error) => {
      foodsPromise = null;
      throw error;
    })
    .finally(() => {
      foodsPromise = null;
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

export const getMpesaStatus = async (checkoutRequestId) => {
  const res = await api.get('/mpesa/status', {
    params: { checkoutRequestId },
  });
  return res.data.data;
};

export const getAllOrders = async () => {
  const res = await api.get('/orders');
  return res.data.data || [];
};

export const getUnassignedOrders = async () => {
  const res = await api.get('/orders/rider/unassigned');
  return res.data.data || [];
};

export const claimOrder = async (orderId) => {
  const res = await api.put(`/orders/${orderId}/claim`);
  return res.data;
};



// ================= AUTH (FIXED) =================
export const loginUser = async (data) => {
  const res = await api.post('/users/login', data);
  return res.data;
};

export const registerUser = async (data) => {
  console.log('[auth] frontend -> register request', {
    endpoint: '/users/register',
    baseURL: API_BASE_URL,
    payload: {
      name: data?.name,
      email: data?.email,
      phone: data?.phone,
    },
  });

  const res = await api.post('/users/register', data);
  console.log('[auth] frontend <- register response', res?.data);
  return res.data;
};

export const verifyEmail = async (data) => {
  const res = await api.post('/users/verify-email', data);
  return res.data;
};

export const savePushSubscription = async (subscriptionData) => {
  const res = await api.post('/notifications/push/subscribe', subscriptionData);
  return res.data;
};

export const sendTestPush = async (payload = {}) => {
  const res = await api.post('/notifications/push/send', payload);
  return res.data;
};

export const sendAdminNotification = async (data) => {
  const res = await api.post('/notifications/admin/broadcast', data);
  return res.data;
};

export const getNotifications = async () => {
  const res = await api.get('/notifications');
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
export const getAdminStats = async () => {
  const res = await api.get('/users/admin/stats');
  return res.data.data;
};

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
  sessionStorage.removeItem('delivo_foods_cache');
  foodsCache = null;
  foodsPromise = null;
  const res = await api.delete(`/foods/${id}`);
  return res.data;
};

export const updateFood = async (id, data) => {
  sessionStorage.removeItem('delivo_foods_cache');
  foodsCache = null;
  foodsPromise = null;
  const res = await api.put(`/foods/${id}`, data);
  return res.data;
};

export const createFood = async (data) => {
  sessionStorage.removeItem('delivo_foods_cache');
  foodsCache = null;
  foodsPromise = null;
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

// ================= MARKETPLACE API =================
export const getMarketplaceCategories = async (params) => {
  const res = await api.get('/marketplace/categories', { params });
  return res.data.data || [];
};

export const createMarketplaceCategory = async (data) => {
  const res = await api.post('/marketplace/categories', data);
  return res.data.data;
};

export const updateMarketplaceCategory = async (id, data) => {
  const res = await api.put(`/marketplace/categories/${id}`, data);
  return res.data.data;
};

export const deleteMarketplaceCategory = async (id) => {
  const res = await api.delete(`/marketplace/categories/${id}`);
  return res.data;
};

export const getMarketplaceProducts = async (params) => {
  const res = await api.get('/marketplace/products', { params });
  return res.data || { data: [], count: 0 };
};

export const getMarketplaceProductById = async (id) => {
  const res = await api.get(`/marketplace/products/${id}`);
  return res.data.data;
};

export const createMarketplaceProduct = async (data) => {
  const res = await api.post('/marketplace/products', data);
  return res.data.data;
};

export const updateMarketplaceProduct = async (id, data) => {
  const res = await api.put(`/marketplace/products/${id}`, data);
  return res.data.data;
};

export const deleteMarketplaceProduct = async (id) => {
  const res = await api.delete(`/marketplace/products/${id}`);
  return res.data;
};

export const duplicateMarketplaceProduct = async (id) => {
  const res = await api.post(`/marketplace/products/${id}/duplicate`);
  return res.data.data;
};

export const bulkMarketplaceProductAction = async (data) => {
  const res = await api.post('/marketplace/products/bulk', data);
  return res.data;
};

export const getMarketplaceStores = async () => {
  const res = await api.get('/marketplace/stores');
  return res.data.data || [];
};

export const createMarketplaceStore = async (data) => {
  const res = await api.post('/marketplace/stores', data);
  return res.data.data;
};

export const updateMarketplaceStore = async (id, data) => {
  const res = await api.put(`/marketplace/stores/${id}`, data);
  return res.data.data;
};

export const deleteMarketplaceStore = async (id) => {
  const res = await api.delete(`/marketplace/stores/${id}`);
  return res.data;
};

export const getMarketplaceBanners = async (params) => {
  const res = await api.get('/marketplace/banners', { params });
  return res.data.data || [];
};

export const createMarketplaceBanner = async (data) => {
  const res = await api.post('/marketplace/banners', data);
  return res.data.data;
};

export const updateMarketplaceBanner = async (id, data) => {
  const res = await api.put(`/marketplace/banners/${id}`, data);
  return res.data.data;
};

export const deleteMarketplaceBanner = async (id) => {
  const res = await api.delete(`/marketplace/banners/${id}`);
  return res.data;
};

export const getMarketplaceFlashSales = async () => {
  const res = await api.get('/marketplace/flash-sales');
  return res.data.data || [];
};

export const createMarketplaceFlashSale = async (data) => {
  const res = await api.post('/marketplace/flash-sales', data);
  return res.data.data;
};

export const updateMarketplaceFlashSale = async (id, data) => {
  const res = await api.put(`/marketplace/flash-sales/${id}`, data);
  return res.data.data;
};

export const deleteMarketplaceFlashSale = async (id) => {
  const res = await api.delete(`/marketplace/flash-sales/${id}`);
  return res.data;
};

// ================= FOOD FLASH SALES =================
export const getFoodFlashSales = async (status) => {
  const res = await api.get('/foods/flash-sales', { params: { status } });
  return res.data.data || [];
};

export const createFoodFlashSale = async (data) => {
  const res = await api.post('/foods/flash-sales', data);
  return res.data.data;
};

export const updateFoodFlashSale = async (id, data) => {
  const res = await api.put(`/foods/flash-sales/${id}`, data);
  return res.data.data;
};

export const deleteFoodFlashSale = async (id) => {
  const res = await api.delete(`/foods/flash-sales/${id}`);
  return res.data;
};

export const getActiveFoodFlashSales = async () => {
  const res = await api.get('/foods/flash-sales/active');
  return res.data;
};

export const getMarketplaceCoupons = async () => {
  const res = await api.get('/marketplace/coupons');
  return res.data.data || [];
};

export const createMarketplaceCoupon = async (data) => {
  const res = await api.post('/marketplace/coupons', data);
  return res.data.data;
};

export const updateMarketplaceCoupon = async (id, data) => {
  const res = await api.put(`/marketplace/coupons/${id}`, data);
  return res.data.data;
};

export const deleteMarketplaceCoupon = async (id) => {
  const res = await api.delete(`/marketplace/coupons/${id}`);
  return res.data;
};

export const getMarketplaceReviews = async () => {
  const res = await api.get('/marketplace/reviews');
  return res.data.data || [];
};

export const createMarketplaceReview = async (data) => {
  const res = await api.post('/marketplace/reviews', data);
  return res.data.data;
};

export const updateMarketplaceReview = async (id, data) => {
  const res = await api.put(`/marketplace/reviews/${id}`, data);
  return res.data.data;
};

export const deleteMarketplaceReview = async (id) => {
  const res = await api.delete(`/marketplace/reviews/${id}`);
  return res.data;
};

export const getSecondHandListings = async (params) => {
  const res = await api.get('/marketplace/second-hand', { params });
  return res.data.data || [];
};

export const createSecondHandListing = async (data) => {
  const res = await api.post('/marketplace/second-hand', data);
  return res.data.data;
};

export const updateSecondHandListing = async (id, data) => {
  const res = await api.put(`/marketplace/second-hand/${id}`, data);
  return res.data.data;
};

export const deleteSecondHandListing = async (id) => {
  const res = await api.delete(`/marketplace/second-hand/${id}`);
  return res.data;
};

export const getMarketplaceOrders = async () => {
  const res = await api.get('/marketplace/orders');
  return res.data.data || [];
};

export const createMarketplaceOrder = async (data) => {
  const res = await api.post('/marketplace/orders', data);
  return res.data.data;
};

export const updateMarketplaceOrder = async (id, data) => {
  const res = await api.put(`/marketplace/orders/${id}`, data);
  return res.data.data;
};

export const deleteMarketplaceOrder = async (id) => {
  const res = await api.delete(`/marketplace/orders/${id}`);
  return res.data;
};

export const getMarketplaceAdminOverview = async () => {
  const res = await api.get('/marketplace/admin/overview');
  return res.data.data;
};

// ================= FOOD DISH RATING =================
export const rateFood = async (foodId, rating) => {
  const res = await api.post(`/foods/${foodId}/rate`, { rating });
  return res.data;
};

// ================= ADMIN AUDIT LOGS =================
export const getAdminLogs = async (page = 1, limit = 50, search = '') => {
  const res = await api.get('/admin-logs', {
    params: { page, limit, search }
  });
  return res.data;
};

// ================= RIDER & ADMIN PAYOUTS (B2C) =================
export const requestRiderWithdrawal = async (data) => {
  const res = await api.post('/payouts/withdraw', data);
  return res.data;
};

export const getRiderEarningsSummary = async () => {
  const res = await api.get('/payouts/my-summary');
  return res.data?.data || {};
};

export const getRiderPayouts = async (page = 1, limit = 20) => {
  const res = await api.get('/payouts/my-payouts', {
    params: { page, limit },
  });
  return res.data;
};

export const getRiderLedger = async (page = 1, limit = 30) => {
  const res = await api.get('/payouts/my-ledger', {
    params: { page, limit },
  });
  return res.data;
};

export const getAdminPayouts = async (params = {}) => {
  const res = await api.get('/payouts/admin/all', { params });
  return res.data;
};

export const adminRetryPayout = async (id) => {
  const res = await api.post(`/payouts/admin/${id}/retry`);
  return res.data;
};

export const getAdminMpesaBalance = async (refresh = false) => {
  const res = await api.get('/payouts/admin/mpesa-balance', {
    params: { refresh },
  });
  return res.data;
};

// ================= EXPORT UTILITIES =================
export { getAPIUrl };

export default api;




