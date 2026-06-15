import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  // Get notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationsApi.getNotifications();
      return response.data;
    },
    staleTime: 0, // Always fresh
  });

  // Get unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: async () => {
      const response = await notificationsApi.getUnreadCount();
      return response.data.count;
    },
    staleTime: 0,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
  };
};
