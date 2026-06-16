import { apiClient } from './client';
import { User, UpdateProfileRequest, UpdateLogoRequest, MemberFilters } from '@/types';

export const profileApi = {
  // Own profile
  getMyProfile: async () => {
    return apiClient.get<User>('/profile/me');
  },

  updateMyProfile: async (data: UpdateProfileRequest) => {
    return apiClient.patch<User>('/profile/me', data);
  },

  updateLogo: async (data: UpdateLogoRequest) => {
    const formData = new FormData();
    formData.append('logo', data.logo);
    return apiClient.patch<{ logo: string }>('/profile/me/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Member directory
  getMembers: async (filters?: MemberFilters) => {
    return apiClient.get<User[]>('/members', { params: filters });
  },

  // Public profile of any user
  getUserProfile: async (userId: string) => {
    return apiClient.get<User>(`/members/${userId}`);
  },
};
