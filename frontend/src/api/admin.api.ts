import { apiClient } from './client';
import { 
  User, 
  Mandate, 
  KycDocument, 
  UpdateKycStatusRequest,
  UserFilters,
  DashboardStats,
  AuditEvent 
} from '@/types';

export const adminApi = {
  // KYC Management
  getKycQueue: async () => {
    return apiClient.get<KycDocument[]>('/admin/kyc/queue');
  },

  getKycDocumentById: async (userId: string) => {
    return apiClient.get<KycDocument>(`/admin/kyc/${userId}`);
  },

  updateKycStatus: async (data: UpdateKycStatusRequest) => {
    return apiClient.patch<KycDocument>('/admin/kyc/update', data);
  },

  // User Management
  getUsers: async (filters?: UserFilters) => {
    return apiClient.get<User[]>('/admin/users', { params: filters });
  },

  getUserById: async (id: string) => {
    return apiClient.get<User>(`/admin/users/${id}`);
  },

  suspendUser: async (id: string, reason: string) => {
    return apiClient.patch(`/admin/users/${id}/suspend`, { reason });
  },

  activateUser: async (id: string) => {
    return apiClient.patch(`/admin/users/${id}/activate`);
  },

  updateUserTier: async (id: string, tier: string) => {
    return apiClient.patch(`/admin/users/${id}/tier`, { tier });
  },

  // Mandate Management
  getAllMandates: async () => {
    return apiClient.get<Mandate[]>('/admin/mandates');
  },

  reviewMandate: async (id: string, data: { status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'; note?: string }) => {
    return apiClient.patch<Mandate>(`/admin/mandates/${id}/review`, data);
  },

  hideMandate: async (id: string, reason: string) => {
    return apiClient.patch(`/admin/mandates/${id}/hide`, { reason });
  },

  unhideMandate: async (id: string) => {
    return apiClient.patch(`/admin/mandates/${id}/unhide`);
  },

  deleteMandate: async (id: string) => {
    return apiClient.delete(`/admin/mandates/${id}`);
  },

  getUserVerificationDetail: async (userId: string) => {
    return apiClient.get<{ user: User; kyc?: KycDocument; mandates: Mandate[] }>(`/admin/verification/users/${userId}`);
  },

  // Stats & Analytics
  getDashboardStats: async () => {
    return apiClient.get<DashboardStats>('/admin/stats/dashboard');
  },

  getRevenueStats: async (period: 'week' | 'month' | 'year') => {
    return apiClient.get<{
      total: number;
      byTier: Record<string, number>;
      trend: Array<{ date: string; amount: number }>;
    }>('/admin/stats/revenue', { params: { period } });
  },

  // Audit Logs
  getAuditLogs: async (page = 1, limit = 50) => {
    return apiClient.get<AuditEvent[]>('/admin/audit-logs', {
      params: { page, limit },
    });
  },
};
