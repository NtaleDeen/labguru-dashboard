import api from './api';
import { AuthResponse, User } from '../types';

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', { username, password });
  return response.data;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/auth/users');
  return response.data;
};

export const createUser = async (userData: {
  username: string;
  email: string;
  password: string;
  role: string;
}): Promise<User> => {
  const response = await api.post<User>('/auth/users', userData);
  return response.data;
};

export const updateUser = async (id: number, updates: Partial<User>): Promise<User> => {
  const response = await api.put<User>(`/auth/users/${id}`, updates);
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/auth/users/${id}`);
};

export const resetPassword = async (id: number, newPassword: string): Promise<void> => {
  await api.post(`/auth/users/${id}/reset-password`, { newPassword });
};