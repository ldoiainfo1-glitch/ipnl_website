import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { introsApi } from '@/api/intros.api';
import { SendIntroRequest, IntroStatus } from '@/types';

export const useIntros = (enabled = true) => {
  const queryClient = useQueryClient();

  // Get sent intros
  const { data: sentIntros, isLoading: isLoadingSent } = useQuery({
    queryKey: ['intros', 'sent'],
    queryFn: async () => {
      const response = await introsApi.getMyIntros('sent');
      return response.data;
    },
    enabled,
  });

  // Get received intros
  const { data: receivedIntros, isLoading: isLoadingReceived } = useQuery({
    queryKey: ['intros', 'received'],
    queryFn: async () => {
      const response = await introsApi.getMyIntros('received');
      return response.data;
    },
    enabled,
  });

  // Get quota status
  const { data: quotaStatus, isLoading: isLoadingQuota } = useQuery({
    queryKey: ['intros', 'quota'],
    queryFn: async () => {
      const response = await introsApi.getQuotaStatus();
      return response.data;
    },
    enabled,
  });

  // Send intro mutation
  const sendIntroMutation = useMutation({
    mutationFn: (data: SendIntroRequest) => introsApi.sendIntro(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intros', 'sent'] });
      queryClient.invalidateQueries({ queryKey: ['intros', 'quota'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Respond to intro mutation
  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IntroStatus }) =>
      introsApi.respondToIntro(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intros', 'received'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    sentIntros: sentIntros || [],
    receivedIntros: receivedIntros || [],
    quotaStatus,
    isLoadingSent,
    isLoadingReceived,
    isLoadingQuota,
    sendIntro: sendIntroMutation.mutateAsync,
    respondToIntro: respondMutation.mutateAsync,
    isSending: sendIntroMutation.isPending,
    isResponding: respondMutation.isPending,
  };
};

// Hook for single intro detail
export const useIntro = (id: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['intro', id],
    queryFn: async () => {
      const response = await introsApi.getIntroById(id);
      return response.data;
    },
    enabled: !!id,
  });

  return {
    intro: data,
    isLoading,
  };
};
