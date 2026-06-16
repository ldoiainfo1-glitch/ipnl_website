import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kycApi } from '@/api/kyc.api';
import { SubmitKycRequest } from '@/types';

export const useKyc = () => {
  const queryClient = useQueryClient();

  const {
    data: kycStatus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['kycStatus'],
    queryFn: async () => {
      const response = await kycApi.getMyKycStatus();
      return response.data;
    },
  });

  const submitKycMutation = useMutation({
    mutationFn: (data: SubmitKycRequest) => kycApi.submitKyc(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycStatus'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const resubmitKycMutation = useMutation({
    mutationFn: (data: SubmitKycRequest) => kycApi.resubmitKyc(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycStatus'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  return {
    kycStatus,
    isLoading,
    error,
    submitKyc: submitKycMutation.mutateAsync,
    resubmitKyc: resubmitKycMutation.mutateAsync,
    isSubmitting: submitKycMutation.isPending || resubmitKycMutation.isPending,
    submitError: submitKycMutation.error,
  };
};
