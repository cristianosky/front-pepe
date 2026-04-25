import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const api = axios.create({ baseURL: API_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@pepe_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || 'Error de conexión';
    return Promise.reject(new Error(msg));
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
  savePushToken: (pushToken) => api.put('/auth/push-token', { pushToken }),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products', { params: { featured: true } }),
  getByCategory: (categoryId) => api.get('/products', { params: { category: categoryId } }),
};

export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getById: (id) => api.get(`/orders/${id}`),
  getByUser: (userId) => api.get(`/orders/user/${userId}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
};

export const staffAPI = {
  getAll: () => api.get('/admin/staff'),
  create: (data) => api.post('/admin/staff', data),
  remove: (id) => api.delete(`/admin/staff/${id}`),
};

export const cocinaAPI = {
  getOrders: () => api.get('/cocina/orders'),
  nextStatus: (id) => api.put(`/cocina/orders/${id}/next`),
};

export const repartidorAPI = {
  getOrders: () => api.get('/repartidor/orders'),
  pickup: (id) => api.put(`/repartidor/orders/${id}/pickup`),
  markDelivered: (id) => api.put(`/repartidor/orders/${id}/delivered`),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getOrders: (status) => api.get('/admin/orders', { params: status ? { status } : {} }),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  getProducts: () => api.get('/admin/products'),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
};

export default api;
