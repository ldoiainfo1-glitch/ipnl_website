import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kycApi } from '@/api/kyc.api';
import { SubmitKycRequest } from '@/types';

export const useKyc = () => {
  const queryClient = useQueryClient();
  const [kycUploadProgress, setKycUploadProgress] = useState<number | null>(null);

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
    mutationFn: ({
      data,
      onProgress,
    }: {
      data: SubmitKycRequest;
      onProgress?: (progress: number) => void;
    }) => kycApi.submitKyc(data, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycStatus'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onSettled: () => {
      setKycUploadProgress(null);
    },
  });

  const resubmitKycMutation = useMutation({
    mutationFn: ({
      data,
      onProgress,
    }: {
      data: SubmitKycRequest;
      onProgress?: (progress: number) => void;
    }) => kycApi.resubmitKyc(data, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycStatus'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onSettled: () => {
      setKycUploadProgress(null);
    },
  });

  const deleteKycDocumentMutation = useMutation({
    mutationFn: (field: keyof SubmitKycRequest) => kycApi.deleteKycDocument(field),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycStatus'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const submitKyc = async (data: SubmitKycRequest) => {
    setKycUploadProgress(0);
    return submitKycMutation.mutateAsync({
      data,
      onProgress: (progress) => setKycUploadProgress(progress),
    });
  };

  const resubmitKyc = async (data: SubmitKycRequest) => {
    setKycUploadProgress(0);
    return resubmitKycMutation.mutateAsync({
      data,
      onProgress: (progress) => setKycUploadProgress(progress),
    });
  };

  return {
    kycStatus,
    isLoading,
    error,
    submitKyc,
    resubmitKyc,
    deleteKycDocument: deleteKycDocumentMutation.mutateAsync,
    isSubmitting: submitKycMutation.isPending || resubmitKycMutation.isPending,
    isDeletingDocument: deleteKycDocumentMutation.isPending,
    submitError: submitKycMutation.error,
    kycUploadProgress,
  };
};
