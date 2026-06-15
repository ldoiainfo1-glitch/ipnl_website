import { apiClient } from './client';
import { Notification } from '@/types';

export const notificationsApi = {
  getNotifications: async (page = 1, limit = 20) => {
    return apiClient.get<Notification[]>('/notifications', {
      params: { page, limit },
    });
  },

  getUnreadCount: async () => {
    return apiClient.get<{ count: number }>('/notifications/unread-count');
  },

  markAsRead: async (id: string) => {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return apiClient.patch('/notifications/read-all');
  },

  deleteNotification: async (id: string) => {
    return apiClient.delete(`/notifications/${id}`);
  },
};
