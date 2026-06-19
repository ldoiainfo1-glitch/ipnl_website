import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from '@/types';

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('ipn_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('ipn_token');
      window.location.href = '/login';
    }

    // Format error response according to RFC 7807
    const apiError: ApiError = error.response?.data || {
      type: 'about:blank',
      title: 'An error occurred',
      status: error.response?.status || 500,
      detail: error.message || 'Unknown error',
    };

    return Promise.reject(apiError);
  }
);

// Generic API response wrapper type
export type ApiClientResponse<T> = Promise<ApiResponse<T>>;

// Helper function to handle API responses
export async function handleApiRequest<T>(
  requestFn: () => Promise<{ data: T }>
): Promise<ApiResponse<T>> {
  const response = await requestFn();
  return {
    data: response.data,
  };
}
