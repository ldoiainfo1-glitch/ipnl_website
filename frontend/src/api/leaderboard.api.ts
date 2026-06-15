import { apiClient } from './client';
import { LeaderboardEntry } from '@/types';

export const leaderboardApi = {
  getLeaderboard: async (period: 'week' | 'month' | 'all' = 'month') => {
    return apiClient.get<LeaderboardEntry[]>('/leaderboard', {
      params: { period },
    });
  },

  getMyRank: async () => {
    return apiClient.get<{
      rank: number;
      totalUsers: number;
      percentile: number;
    }>('/leaderboard/my-rank');
  },
};
