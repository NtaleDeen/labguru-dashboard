import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage
    this.loadToken();

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        
        // Show error toast
        const message = error.response?.data?.error || error.message || 'An error occurred';
        toast.error(message);
        
        return Promise.reject(error);
      }
    );
  }

  private loadToken() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async get<T = any>(url: string, params?: any): Promise<T> {
    const response: AxiosResponse = await this.client.get(url, { params });
    return response.data;
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse = await this.client.post(url, data);
    return response.data;
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse = await this.client.put(url, data);
    return response.data;
  }

  async delete<T = any>(url: string): Promise<T> {
    const response: AxiosResponse = await this.client.delete(url);
    return response.data;
  }

  // Auth methods
  async login(username: string, password: string) {
    const response = await this.post<{ token: string; username: string; role: string; client_id?: number }>('/auth/login', {
      username,
      password,
    });
    
    if (response.token) {
      this.setToken(response.token);
      localStorage.setItem('user', JSON.stringify({
        username: response.username,
        role: response.role,
        client_id: response.client_id,
      }));
    }
    
    return response;
  }

  async logout() {
    this.clearToken();
  }

  async getProfile() {
    return this.get('/auth/profile');
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.post('/auth/change-password', { currentPassword, newPassword });
  }

  // User management
  async getUsers(params?: any) {
    return this.get('/users', params);
  }

  async createUser(data: any) {
    return this.post('/users', data);
  }

  async updateUser(id: number, data: any) {
    return this.put(`/users/${id}`, data);
  }

  async deleteUser(id: number) {
    return this.delete(`/users/${id}`);
  }

  // Metadata management
  async getMetadata(params?: any) {
    return this.get('/metadata', params);
  }

  async getUnmatchedTests() {
    return this.get('/metadata/unmatched');
  }

  async createMetadata(data: any) {
    return this.post('/metadata', data);
  }

  async updateMetadata(id: number, data: any) {
    return this.put(`/metadata/${id}`, data);
  }

  async deleteMetadata(id: number) {
    return this.delete(`/metadata/${id}`);
  }

  async importMetadata(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.client.post('/metadata/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  async exportMetadata() {
    const response = await this.client.get('/metadata/export', {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'meta_export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // Revenue data
  async getRevenueData(params?: any) {
    return this.get('/revenue', params);
  }

  async getRevenueAggregations(params?: any) {
    return this.get('/revenue/aggregations', params);
  }

  async getRevenueKPIs(params?: any) {
    return this.get('/revenue/kpis', params);
  }

  async getMonthlyTarget(year: number, month: number) {
    return this.get('/revenue/target', { year, month });
  }

  async setMonthlyTarget(year: number, month: number, target_amount: number) {
    return this.post('/revenue/target', { year, month, target_amount });
  }

  // LRIDS
  async getLRIDSData(params?: any) {
    return this.get('/lrids', params);
  }

  async cancelTest(data: any) {
    return this.post('/lrids/cancel', data);
  }

  async getCancelledTests(params?: any) {
    return this.get('/lrids/cancelled', params);
  }

  // Dashboard
  async getDashboardStats() {
    return this.get('/dashboard/stats');
  }

  async getDashboardActivity() {
    return this.get('/dashboard/activity');
  }
}

export const api = new ApiClient();