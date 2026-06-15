import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mandatesApi } from '@/api/mandates.api';
import { MandateFilters, CreateMandateRequest } from '@/types';

export const useMandates = (filters?: MandateFilters) => {
  const queryClient = useQueryClient();

  // Get all mandates
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mandates', filters],
    queryFn: async () => {
      const response = await mandatesApi.getMandates(filters);
      return response.data;
    },
    staleTime: 30000, // 30 seconds
  });

  // Get my mandates
  const { data: myMandates, isLoading: isLoadingMyMandates } = useQuery({
    queryKey: ['myMandates'],
    queryFn: async () => {
      const response = await mandatesApi.getMyMandates();
      return response.data;
    },
  });

  // Create mandate mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateMandateRequest) => mandatesApi.createMandate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandates'] });
      queryClient.invalidateQueries({ queryKey: ['myMandates'] });
    },
  });

  // Update mandate mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateMandateRequest> }) =>
      mandatesApi.updateMandate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandates'] });
      queryClient.invalidateQueries({ queryKey: ['myMandates'] });
    },
  });

  // Delete mandate mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => mandatesApi.deleteMandate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandates'] });
      queryClient.invalidateQueries({ queryKey: ['myMandates'] });
    },
  });

  // Close mandate mutation
  const closeMutation = useMutation({
    mutationFn: (id: string) => mandatesApi.closeMandate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandates'] });
      queryClient.invalidateQueries({ queryKey: ['myMandates'] });
    },
  });

  return {
    mandates: data?.items || [],
    meta: data?.meta,
    myMandates: myMandates?.items || [],
    isLoading,
    isLoadingMyMandates,
    error,
    refetch,
    createMandate: createMutation.mutateAsync,
    updateMandate: updateMutation.mutateAsync,
    deleteMandate: deleteMutation.mutateAsync,
    closeMandate: closeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// Hook for single mandate detail
export const useMandate = (id: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['mandate', id],
    queryFn: async () => {
      const response = await mandatesApi.getMandateById(id);
      return response.data;
    },
    enabled: !!id,
  });

  return {
    mandate: data,
    isLoading,
    error,
  };
};
