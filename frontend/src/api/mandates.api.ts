import { apiClient } from './client';
import { 
  Mandate, 
  CreateMandateRequest, 
  MandateFilters, 
  PaginationMeta 
} from '@/types';

export const mandatesApi = {
  getMandates: async (filters?: MandateFilters) => {
    return apiClient.get<{ items: Mandate[]; meta: PaginationMeta }>(
      '/mandates',
      { params: filters }
    );
  },

  getMandateById: async (id: string) => {
    return apiClient.get<Mandate>(`/mandates/${id}`);
  },

  createMandate: async (data: CreateMandateRequest) => {
    return apiClient.post<Mandate>('/mandates', data);
  },

  updateMandate: async (id: string, data: Partial<CreateMandateRequest>) => {
    return apiClient.patch<Mandate>(`/mandates/${id}`, data);
  },

  deleteMandate: async (id: string) => {
    return apiClient.delete(`/mandates/${id}`);
  },

  getMyMandates: async (filters?: MandateFilters) => {
    return apiClient.get<{ items: Mandate[]; meta: PaginationMeta }>(
      '/mandates/my',
      { params: filters }
    );
  },

  closeMandate: async (id: string) => {
    return apiClient.patch<Mandate>(`/mandates/${id}/close`);
  },
};
