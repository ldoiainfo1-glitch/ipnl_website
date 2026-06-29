import { apiClient } from './client';
import { LoginRequest, RegisterRequest, User } from '@/types';

export const authApi = {
  login: async (data: LoginRequest) => {
    return apiClient.post<{ user: User; token: string }>('/auth/login', data);
  },

  register: async (data: RegisterRequest) => {
    return apiClient.post<{ user: User; token: string }>('/auth/register', data);
  },

  logout: async () => {
    return apiClient.post('/auth/logout');
  },

  getCurrentUser: async () => {
    return apiClient.get<User>('/auth/me');
  },

  getAdminAccess: async () => {
    return apiClient.get<{ isAdmin: boolean }>('/auth/admin-access');
  },

  refreshToken: async () => {
    return apiClient.post<{ token: string }>('/auth/refresh');
  },
};
