import { apiClient } from './client';
import { ReputationReview, ReputationStats } from '@/types';

export const reputationApi = {
  getMemberReviews: async (userId: string) => {
    return apiClient.get<{ stats?: ReputationStats; reviews: ReputationReview[] }>(`/reputation/members/${userId}/reviews`);
  },

  createMemberReview: async (userId: string, data: { rating: number; comment?: string; mandateId?: string }) => {
    return apiClient.post<{ review: ReputationReview; stats?: ReputationStats }>(`/reputation/members/${userId}/reviews`, data);
  },
};
