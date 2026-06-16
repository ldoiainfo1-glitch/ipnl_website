import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/api/profile.api';
import { useAuthStore } from '@/store/authStore';
import { MemberFilters, UpdateProfileRequest, UpdateLogoRequest } from '@/types';

export const useMyProfile = () => {
  const queryClient = useQueryClient();
  const { user: storeUser } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      const res = await profileApi.getMyProfile();
      return res.data;
    },
    enabled: !!storeUser,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileApi.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const updateLogoMutation = useMutation({
    mutationFn: (data: UpdateLogoRequest) => profileApi.updateLogo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  return {
    profile,
    isLoading,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    updateLogo: updateLogoMutation.mutateAsync,
    isUploadingLogo: updateLogoMutation.isPending,
  };
};

export const useMembers = (filters?: MemberFilters) => {
  return useQuery({
    queryKey: ['members', filters],
    queryFn: async () => {
      const res = await profileApi.getMembers(filters);
      return res.data;
    },
  });
};

export const useUserProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const res = await profileApi.getUserProfile(userId!);
      return res.data;
    },
    enabled: !!userId,
  });
};
