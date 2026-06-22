import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/api/profile.api';
import { useAuthStore } from '@/store/authStore';
import { MemberFilters, UpdateProfileRequest, UpdateLogoRequest } from '@/types';

export const useMyProfile = () => {
  const queryClient = useQueryClient();
  const { user: storeUser } = useAuthStore();
  const [logoUploadProgress, setLogoUploadProgress] = useState<number | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      const res = await profileApi.getMyProfile();
      return res.data;
    },
    enabled: !!storeUser,
  });

  useEffect(() => {
    if (!profile || !storeUser) return;
    if (storeUser.role === profile.role && storeUser.tier === profile.tier) return;

    useAuthStore.setState({
      user: {
        ...storeUser,
        role: profile.role,
        tier: profile.tier,
        companyName: profile.companyName,
      },
    });
  }, [profile, storeUser]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileApi.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const updateLogoMutation = useMutation({
    mutationFn: ({ data, onProgress }: { data: UpdateLogoRequest; onProgress?: (progress: number) => void }) =>
      profileApi.updateLogo(data, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onSettled: () => {
      setLogoUploadProgress(null);
    },
  });

  const updateLogo = async (data: UpdateLogoRequest) => {
    setLogoUploadProgress(0);
    return updateLogoMutation.mutateAsync({
      data,
      onProgress: (progress) => setLogoUploadProgress(progress),
    });
  };

  return {
    profile,
    isLoading,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    updateLogo,
    isUploadingLogo: updateLogoMutation.isPending,
    logoUploadProgress,
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
