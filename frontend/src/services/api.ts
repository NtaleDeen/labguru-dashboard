import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Revenue API
export const revenueAPI = {
  getDailyRevenue: (params: any) => api.get('/revenue/daily', { params }),
  getSectionRevenue: (params: any) => api.get('/revenue/sections', { params }),
  getTopTests: (params: any) => api.get('/revenue/top-tests', { params }),
  getStats: (params: any) => api.get('/revenue/stats', { params }),
  getMonthly: (params: any) => api.get('/revenue/monthly', { params }),
  getQuarterly: (params: any) => api.get('/revenue/quarterly', { params }),
};

// Tests API
export const testsAPI = {
  getAll: (params?: any) => api.get('/tests', { params }),
  getById: (id: string) => api.get(`/tests/${id}`),
  create: (data: any) => api.post('/tests', data),
  update: (id: string, data: any) => api.put(`/tests/${id}`, data),
  delete: (id: string) => api.delete(`/tests/${id}`),
  getSections: () => api.get('/tests/sections'),
  bulkImport: (tests: any[]) => api.post('/tests/bulk-import', { tests }),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  resetPassword: (id: number, newPassword: string) =>
    api.post(`/users/${id}/reset-password`, { newPassword }),
};