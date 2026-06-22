import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, RegisterRequest } from '@/types';
import { authApi } from '@/api/auth.api';
import supabase from '@/lib/supabase';

function normalizeAuthUser(user: any) {
  const role = String(user?.role || user?.user_metadata?.role || user?.app_metadata?.role || '').toUpperCase();
  return {
    ...user,
    role: role || user?.role,
    companyName: user?.companyName || user?.user_metadata?.companyName || '',
    tier: user?.tier || 'OBSERVER',
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          // If Supabase client is configured, use Supabase Auth
          if (supabase) {
            const result = await supabase.auth.signInWithPassword({ email, password });
            if (result.error) throw result.error;
            const user = normalizeAuthUser(result.data.user as any);
            const token = result.data.session?.access_token;

            set({ user, token, isAuthenticated: !!token });
            if (token) localStorage.setItem('ipn_token', token);
            return;
          }

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
          if (supabase) {
            const result = await supabase.auth.signUp({ email: data.email, password: (data as any).password, options: { data: { companyName: data.companyName } } });
            if (result.error) throw result.error;
            const user = normalizeAuthUser(result.data.user as any);
            const token = result.data.session?.access_token;
            set({ user, token, isAuthenticated: !!token });
            if (token) localStorage.setItem('ipn_token', token);
            return;
          }

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
          if (supabase) {
            // Create demo user via backend then sign in with Supabase to get a session
            const response = await authApi.demoLogin();
            const creds = (response.data as any).credentials;
            if (!creds || !creds.email || !creds.password) {
              throw new Error('Demo credentials missing');
            }
            const signIn = await supabase.auth.signInWithPassword({ email: creds.email, password: creds.password });
            if (signIn.error) throw signIn.error;
            const user = normalizeAuthUser(signIn.data.user as any);
            const token = signIn.data.session?.access_token;
            set({ user, token, isAuthenticated: !!token });
            if (token) localStorage.setItem('ipn_token', token);
            return;
          }

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
