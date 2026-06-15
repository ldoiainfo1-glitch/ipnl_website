import { apiClient } from './client';
import { Introduction, SendIntroRequest, IntroStatus } from '@/types';

export const introsApi = {
  sendIntro: async (data: SendIntroRequest) => {
    return apiClient.post<Introduction>('/intros', data);
  },

  getMyIntros: async (type: 'sent' | 'received') => {
    return apiClient.get<Introduction[]>(`/intros/my/${type}`);
  },

  respondToIntro: async (id: string, status: IntroStatus) => {
    return apiClient.patch<Introduction>(`/intros/${id}/respond`, { status });
  },

  getIntroById: async (id: string) => {
    return apiClient.get<Introduction>(`/intros/${id}`);
  },

  getQuotaStatus: async () => {
    return apiClient.get<{
      limit: number;
      used: number;
      remaining: number;
      resetDate: string;
    }>('/intros/quota');
  },
};
