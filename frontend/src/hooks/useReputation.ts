import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reputationApi } from '@/api/reputation.api';

export const useMemberReviews = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ['memberReviews', userId],
    queryFn: async () => {
      const response = await reputationApi.getMemberReviews(userId!);
      return response.data;
    },
    enabled: !!userId,
  });

  const createReviewMutation = useMutation({
    mutationFn: (data: { rating: number; comment?: string; mandateId?: string }) =>
      reputationApi.createMemberReview(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberReviews', userId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
    },
  });

  return {
    reviews: reviewsQuery.data?.reviews ?? [],
    stats: reviewsQuery.data?.stats,
    isLoading: reviewsQuery.isLoading,
    createReview: createReviewMutation.mutateAsync,
    isCreatingReview: createReviewMutation.isPending,
    createReviewError: createReviewMutation.error,
  };
};
