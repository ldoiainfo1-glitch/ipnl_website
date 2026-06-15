import { apiClient } from './client';
import { UserTier } from '@/types';

export const billingApi = {
  createCheckoutSession: async (tier: UserTier) => {
    return apiClient.post<{ sessionId: string; checkoutUrl: string }>(
      '/billing/checkout',
      { tier }
    );
  },

  getSubscriptionStatus: async () => {
    return apiClient.get<{
      tier: UserTier;
      isActive: boolean;
      currentPeriodEnd?: string;
      cancelAtPeriodEnd: boolean;
    }>('/billing/subscription');
  },

  cancelSubscription: async () => {
    return apiClient.post('/billing/cancel');
  },

  getInvoices: async () => {
    return apiClient.get<Array<{
      id: string;
      amount: number;
      status: string;
      invoiceUrl: string;
      createdAt: string;
    }>>('/billing/invoices');
  },
};
