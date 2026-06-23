import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/api/messages.api';
import { SendMessageRequest } from '@/types';

export const useConversations = () => {
  const queryClient = useQueryClient();

  // Get all conversations
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await messagesApi.getConversations();
      return response.data;
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: (participantIds: string[]) =>
      messagesApi.createConversation(participantIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    conversations: conversations || [],
    isLoading,
    createConversation: createConversationMutation.mutateAsync,
    isCreating: createConversationMutation.isPending,
  };
};

// Hook for single conversation with messages
export const useConversation = (conversationId: string) => {
  const queryClient = useQueryClient();

  // Get conversation details
  const { data: conversation, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const response = await messagesApi.getConversationById(conversationId);
      return response.data;
    },
    enabled: !!conversationId,
  });

  // Get messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await messagesApi.getMessages(conversationId);
      return response.data;
    },
    enabled: !!conversationId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: SendMessageRequest) => messagesApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const sendProfileDetailsMutation = useMutation({
    mutationFn: () => messagesApi.sendProfileDetails(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: () => messagesApi.markAsRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    conversation,
    messages: messages || [],
    isLoadingConversation,
    isLoadingMessages,
    sendMessage: sendMessageMutation.mutateAsync,
    sendProfileDetails: sendProfileDetailsMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutate,
    markAsReadAsync: markAsReadMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    isSendingProfileDetails: sendProfileDetailsMutation.isPending,
  };
};
