import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { isAdminUser } from '@/lib/authRole';

export function useAdminAccess() {
  const { user, isAuthenticated } = useAuthStore();

  const { data } = useQuery({
    queryKey: ['adminAccess'],
    queryFn: async () => {
      const res = await authApi.getAdminAccess();
      return res.data;
    },
    enabled: isAuthenticated && !!user,
    staleTime: 0,
  });

  return Boolean(data?.isAdmin || isAdminUser(user));
}
