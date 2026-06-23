import { AxiosProgressEvent } from 'axios';
import { apiClient } from './client';
import { User, UpdateProfileRequest, UpdateLogoRequest, MemberFilters, MemberProfileResponse } from '@/types';

type UploadProgressCallback = (progressPercent: number) => void;

function toUploadPercent(event: AxiosProgressEvent): number {
  if (!event.total || event.total <= 0) return 0;
  return Math.min(100, Math.round((event.loaded / event.total) * 100));
}

export const profileApi = {
  // Own profile
  getMyProfile: async () => {
    return apiClient.get<User>('/profile/me');
  },

  updateMyProfile: async (data: UpdateProfileRequest) => {
    return apiClient.patch<User>('/profile/me', data);
  },

  updateLogo: async (data: UpdateLogoRequest, onProgress?: UploadProgressCallback) => {
    const formData = new FormData();
    formData.append('logo', data.logo);
    return apiClient.patch<{ logo: string }>('/profile/me/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        onProgress?.(toUploadPercent(event));
      },
    });
  },

  // Member directory
  getMembers: async (filters?: MemberFilters) => {
    return apiClient.get<User[]>('/profile/members', { params: filters });
  },

  // Public profile of any user
  getUserProfile: async (userId: string) => {
    return apiClient.get<MemberProfileResponse>(`/profile/members/${userId}`);
  },
};
