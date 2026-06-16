import { apiClient } from './client';
import { KycDocument, SubmitKycRequest } from '@/types';

export const kycApi = {
  getMyKycStatus: async () => {
    return apiClient.get<KycDocument>('/kyc/me');
  },

  submitKyc: async (data: SubmitKycRequest) => {
    const formData = new FormData();
    if (data.panCard) formData.append('panCard', data.panCard);
    if (data.gstCertificate) formData.append('gstCertificate', data.gstCertificate);
    if (data.reraCertificate) formData.append('reraCertificate', data.reraCertificate);
    if (data.incorporationCertificate) formData.append('incorporationCertificate', data.incorporationCertificate);
    if (data.addressProof) formData.append('addressProof', data.addressProof);

    return apiClient.post<KycDocument>('/kyc/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  resubmitKyc: async (data: SubmitKycRequest) => {
    const formData = new FormData();
    if (data.panCard) formData.append('panCard', data.panCard);
    if (data.gstCertificate) formData.append('gstCertificate', data.gstCertificate);
    if (data.reraCertificate) formData.append('reraCertificate', data.reraCertificate);
    if (data.incorporationCertificate) formData.append('incorporationCertificate', data.incorporationCertificate);
    if (data.addressProof) formData.append('addressProof', data.addressProof);

    return apiClient.patch<KycDocument>('/kyc/resubmit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
