import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// ── Request Interceptor: Attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hx_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hx_token');
      localStorage.removeItem('hx_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const sendOTP = (data) => api.post('/auth/send-otp', data);
export const verifyOTP = (data) => api.post('/auth/verify-otp', data);
export const verifyOrderOTP = (data) => api.post('/auth/verify-order-otp', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const registerUser = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.patch('/auth/me', data);

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const updateStock = (id, data) => api.patch(`/products/${id}/stock`, data);

// ── Cart ──────────────────────────────────────────────────────────────────────
export const getCart = () => api.get('/cart');
export const addToCart = (data) => api.post('/cart/items', data);
export const updateCartItem = (productId, data) => api.patch(`/cart/items/${productId}`, data);
export const removeFromCart = (productId) => api.delete(`/cart/items/${productId}`);
export const applyCoupon = (data) => api.post('/cart/coupon', data);
export const removeCoupon = () => api.delete('/cart/coupon');
export const clearCart = () => api.delete('/cart');

// ── Orders ────────────────────────────────────────────────────────────────────
export const createOrder = (data) => api.post('/orders', data);
export const getOrders = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, data) => api.patch(`/orders/${id}/status`, data);
export const cancelOrder = (id, data) => api.post(`/orders/${id}/cancel`, data);
export const verifyDeliveryOTP = (id, data) => api.post(`/orders/${id}/verify-otp`, data);
export const rateOrder = (id, data) => api.post(`/orders/${id}/rate`, data);
export const requestReturn = (id, data) => api.post(`/orders/${id}/return`, data);
export const reorder = (id) => api.post(`/orders/${id}/reorder`);
export const selfAssignOrder = (id) => api.post(`/orders/${id}/assign-me`);
export const getStats = () => api.get('/orders/stats');

// ── Riders ────────────────────────────────────────────────────────────────────
export const getRiders = () => api.get('/riders');
export const createRider = (data) => api.post('/riders', data);
export const updateRider = (id, data) => api.put(`/riders/${id}`, data);
export const deleteRider = (id) => api.delete(`/riders/${id}`);
export const getRiderStats = (id) => api.get(`/riders/${id}/stats`);

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// ── Coupons ───────────────────────────────────────────────────────────────────
export const getCoupons = () => api.get('/coupons');
export const createCoupon = (data) => api.post('/coupons', data);
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`);
export const validateCoupon = (data) => api.post('/coupons/validate', data);

export default api;
