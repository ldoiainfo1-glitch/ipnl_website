import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/api/profile.api';
import { useAuthStore } from '@/store/authStore';
import { MemberFilters, UpdateProfileRequest, UpdateLogoRequest, User } from '@/types';

function syncAuthUser(profile: Partial<User>) {
  const currentUser = useAuthStore.getState().user;
  if (!currentUser || (profile.id && profile.id !== currentUser.id)) return;

  const nextUser = { ...currentUser, ...profile };
  const hasChanged = Object.keys(nextUser).some((key) => {
    const userKey = key as keyof User;
    return currentUser[userKey] !== nextUser[userKey];
  });

  if (hasChanged) {
    useAuthStore.setState({ user: nextUser });
  }
}

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
    if (profile) syncAuthUser(profile);
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileApi.updateMyProfile(data),
    onSuccess: (response) => {
      syncAuthUser(response.data);
      queryClient.setQueryData(['myProfile'], response.data);
      queryClient.setQueryData(['currentUser'], response.data);
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const updateLogoMutation = useMutation({
    mutationFn: ({ data, onProgress }: { data: UpdateLogoRequest; onProgress?: (progress: number) => void }) =>
      profileApi.updateLogo(data, onProgress),
    onSuccess: (response) => {
      const logoUpdate = { logo: response.data.logo };
      syncAuthUser(logoUpdate);
      queryClient.setQueryData<User | undefined>(['myProfile'], (current) =>
        current ? { ...current, ...logoUpdate } : current,
      );
      queryClient.setQueryData<User | undefined>(['currentUser'], (current) =>
        current ? { ...current, ...logoUpdate } : current,
      );
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
