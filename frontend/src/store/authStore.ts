'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Portal } from '@/types';
import { authApi } from '@/lib/authApi';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  portal: Portal | null;
  isLoading: boolean;

  setCredentials: (user: User, accessToken: string, refreshToken: string) => void;
  setPortal: (portal: Portal) => void;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      portal: null,
      isLoading: false,

      setCredentials: (user, accessToken, refreshToken) => {
        // Keep localStorage in sync for the Axios interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
        set({ user, accessToken, refreshToken });
      },

      setPortal: (portal) => set({ portal }),

      updateUser: (user) => set({ user }),

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) await authApi.logout(refreshToken);
        } catch {
          // Ignore errors on logout
        } finally {
          get().clearAuth();
        }
      },

      refreshProfile: async () => {
        try {
          const user = await authApi.getProfile();
          set({ user });
        } catch {
          // token might be expired — interceptor will handle redirect
        }
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        set({ user: null, accessToken: null, refreshToken: null, portal: null });
      },
    }),
    {
      name: 'ems-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        portal: state.portal,
      }),
    },
  ),
);
