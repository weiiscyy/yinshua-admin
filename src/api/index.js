import axios from 'axios';
import { message } from 'antd';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://10.147.19.111:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// 请求拦截：注入 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const errMsg = error.response?.data?.error || '请求失败';
    message.error(errMsg);
    return Promise.reject(error);
  }
);

// Auth
export const login = (username, password) =>
  api.post('/api/auth/login', { username, password });

export const getMe = () => api.get('/api/auth/me');

// Orders
export const searchOrders = (params) =>
  api.get('/api/orders/search', { params });

export const getOrderProgress = (productType, ddId) =>
  api.get(`/api/orders/progress/${productType}/${ddId}`);

export const getOrderStats = () => api.get('/api/orders/stats');

// Admin
export const adminListOrders = (params) =>
  api.get('/api/admin/orders', { params });

export const adminGetOrder = (productType, ddId) =>
  api.get(`/api/admin/orders/${productType}/${ddId}`);

export const adminUpdateStep = (productType, ddId, step, completed) =>
  api.post(`/api/admin/orders/${productType}/${ddId}/step`, { step, completed });

export const adminUpdateOrder = (productType, ddId, fields) =>
  api.patch(`/api/admin/orders/${productType}/${ddId}`, fields);

export const adminCreateOrder = (data) =>
  api.post('/api/admin/orders', data);

export const adminGetOverview = () =>
  api.get('/api/admin/orders/stats/overview');

export const adminListUsers = () =>
  api.get('/api/admin/orders/users/list');

export const salespersonsList = () =>
  api.get('/api/base-data/salespersons');

// 发货单
const fh = (method, url, data) => api[method](`/api/fahuo${url}`, data);
export const fahuoList = (params) => api.get('/api/fahuo/list', { params });
export const fahuoGet = (id) => api.get(`/api/fahuo/${id}`);
export const fahuoCreate = (data) => api.post('/api/fahuo', data);
export const fahuoUpdate = (id, data) => api.put(`/api/fahuo/${id}`, data);
export const fahuoDelete = (id) => api.delete(`/api/fahuo/${id}`);

// 综合查询
export const queryOrders = (params) =>
  api.get('/api/query/query', { params });

export const exportOrders = (params) =>
  api.get('/api/query/export', { params });

export const getLatestOrders = (params) =>
  api.get('/api/query/latest', { params });

// 统计看板
export const getStatsTrend = (params) => api.get('/api/stats/trend', { params });
export const getStatsOverview = () => api.get('/api/stats/overview');
export const getStatsStatusDist = () => api.get('/api/stats/status_dist');
export const getStatsYwy = () => api.get('/api/stats/ywy_stats');

// 生产报工
export const getProductionOrders = (params) => api.get('/api/production/orders', { params });
export const getProductionOrder = (ddId, productType) => api.get(`/api/production/order/${ddId}?product_type=${productType}`);
export const submitReport = (data) => api.post('/api/production/report', data);
export const getMyReports = (params) => api.get('/api/production/my-reports', { params });
export const getProductionStatsWorker = (params) => api.get('/api/production/stats/worker', { params });
export const getProductionStatsDaily = (params) => api.get('/api/production/stats/daily', { params });
export const getProductionOrderStats = (ddId, productType) => api.get(`/api/production/stats/order/${ddId}?product_type=${productType}`);

export default api;
