import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, RegisterRequest } from '@/types';
import { authApi } from '@/api/auth.api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await authApi.login({ email, password });
          const { user, token } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
          });

          // Store token in axios defaults
          if (token) {
            localStorage.setItem('ipn_token', token);
          }
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        try {
          const response = await authApi.register(data);
          const { user, token } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
          });

          // Store token in axios defaults
          if (token) {
            localStorage.setItem('ipn_token', token);
          }
        } catch (error) {
          console.error('Registration failed:', error);
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('ipn_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      demoLogin: async () => {
        try {
          const response = await authApi.demoLogin();
          const { user, token } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
          });

          // Store token in axios defaults
          if (token) {
            localStorage.setItem('ipn_token', token);
          }
        } catch (error) {
          console.error('Demo login failed:', error);
          throw error;
        }
      },
    }),
    {
      name: 'ipn-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
