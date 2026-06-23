import { apiClient } from './client';
import { Conversation, Message, SendMessageRequest } from '@/types';

export const messagesApi = {
  getConversations: async () => {
    return apiClient.get<Conversation[]>('/messages/conversations');
  },

  getConversationById: async (id: string) => {
    return apiClient.get<Conversation>(`/messages/conversations/${id}`);
  },

  getMessages: async (conversationId: string, page = 1, limit = 50) => {
    return apiClient.get<Message[]>(`/messages/${conversationId}`, {
      params: { page, limit },
    });
  },

  sendMessage: async (data: SendMessageRequest) => {
    return apiClient.post<Message>('/messages', data);
  },

  sendProfileDetails: async (conversationId: string) => {
    return apiClient.post<Message>('/messages/profile-details', { conversationId });
  },

  markAsRead: async (conversationId: string) => {
    return apiClient.patch(`/messages/${conversationId}/read`);
  },

  createConversation: async (participantIds: string[]) => {
    return apiClient.post<Conversation>('/messages/conversations', {
      participantIds,
    });
  },
};
