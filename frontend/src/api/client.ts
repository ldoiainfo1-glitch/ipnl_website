import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from '@/types';

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
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

      // IMPORTANT: never force a hard browser navigation here.
      // window.location.href causes a full page reload, which on an SPA
      // wipes all in-memory state — and if the page we land on (e.g. a
      // currentUser query that runs on mount) also gets a 401, this
      // interceptor fires again, causing a reload loop that looks like
      // the page "flashing" or repeatedly reloading.
      //
      // Instead: clear the persisted auth state directly (so
      // isAuthenticated flips to false) and let React Router's existing
      // route guards in App.tsx redirect declaratively. Only do this if
      // we're not already on a public/auth route, to avoid redundant
      // work and any chance of a loop.
      const publicPaths = ['/login', '/register', '/', '/pricing', '/privacy', '/terms', '/rera-protocol', '/contact'];
      const onPublicPath = publicPaths.includes(window.location.pathname);

      if (!onPublicPath) {
        // Lazy import to avoid a circular dependency between the store
        // (which doesn't import this client directly for auth state
        // clearing) and this client module.
        import('@/store/authStore').then(({ useAuthStore }) => {
          useAuthStore.getState().logout();
        });
      }
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
