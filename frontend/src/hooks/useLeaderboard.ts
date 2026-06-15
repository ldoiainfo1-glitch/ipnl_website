import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '@/api/leaderboard.api';

export const useLeaderboard = (period: 'week' | 'month' | 'all' = 'month') => {
  // Get leaderboard
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const response = await leaderboardApi.getLeaderboard(period);
      return response.data;
    },
  });

  // Get my rank
  const { data: myRank, isLoading: isLoadingRank } = useQuery({
    queryKey: ['leaderboard', 'myRank'],
    queryFn: async () => {
      const response = await leaderboardApi.getMyRank();
      return response.data;
    },
  });

  return {
    leaderboard: leaderboard || [],
    myRank,
    isLoading,
    isLoadingRank,
  };
};
