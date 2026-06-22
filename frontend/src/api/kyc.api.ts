import { AxiosProgressEvent } from 'axios';
import { apiClient } from './client';
import { KycDocument, SubmitKycRequest } from '@/types';

type UploadProgressCallback = (progressPercent: number) => void;

function toUploadPercent(event: AxiosProgressEvent): number {
  if (!event.total || event.total <= 0) return 0;
  return Math.min(100, Math.round((event.loaded / event.total) * 100));
}

export const kycApi = {
  getMyKycStatus: async () => {
    return apiClient.get<KycDocument>('/kyc/me');
  },

  submitKyc: async (data: SubmitKycRequest, onProgress?: UploadProgressCallback) => {
    const formData = new FormData();
    if (data.panCard) formData.append('panCard', data.panCard);
    if (data.gstCertificate) formData.append('gstCertificate', data.gstCertificate);
    if (data.reraCertificate) formData.append('reraCertificate', data.reraCertificate);
    if (data.incorporationCertificate) formData.append('incorporationCertificate', data.incorporationCertificate);
    if (data.addressProof) formData.append('addressProof', data.addressProof);

    return apiClient.post<KycDocument>('/kyc/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        onProgress?.(toUploadPercent(event));
      },
    });
  },

  resubmitKyc: async (data: SubmitKycRequest, onProgress?: UploadProgressCallback) => {
    const formData = new FormData();
    if (data.panCard) formData.append('panCard', data.panCard);
    if (data.gstCertificate) formData.append('gstCertificate', data.gstCertificate);
    if (data.reraCertificate) formData.append('reraCertificate', data.reraCertificate);
    if (data.incorporationCertificate) formData.append('incorporationCertificate', data.incorporationCertificate);
    if (data.addressProof) formData.append('addressProof', data.addressProof);

    return apiClient.patch<KycDocument>('/kyc/resubmit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        onProgress?.(toUploadPercent(event));
      },
    });
  },

  deleteKycDocument: async (field: keyof SubmitKycRequest) => {
    return apiClient.delete<KycDocument>(`/kyc/documents/${field}`);
  },
};
