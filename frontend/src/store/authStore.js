import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api.js';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      blocked: null, // { reason } | null

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({ token: data.token, user: data.user, blocked: null });
        return data;
      },

      register: async (username, email, password) => {
        const { data } = await api.post('/auth/register', { username, email, password });
        set({ token: data.token, user: data.user, blocked: null });
        return data;
      },

      loginWithGoogleToken: async (accessToken) => {
        const { data } = await api.post('/auth/google', { accessToken });
        set({ token: data.token, user: data.user, blocked: null });
        return data;
      },

      loginWithGithubCode: async (code) => {
        const { data } = await api.post('/auth/github', { code });
        set({ token: data.token, user: data.user, blocked: null });
        return data;
      },

      oauthLogin: async (provider, email, username) => {
        try {
          const { data } = await api.post('/auth/oauth', { provider, email, username });
          set({ token: data.token, user: data.user, blocked: null });
          return data;
        } catch (err) {
          if (err.response?.status === 404) {
            const fallbackPassword = 'OAuthDefaultPass_2026!';
            try {
              const { data } = await api.post('/auth/login', { email, password: fallbackPassword });
              set({ token: data.token, user: data.user, blocked: null });
              return data;
            } catch {
              const { data } = await api.post('/auth/register', { username, email, password: fallbackPassword });
              set({ token: data.token, user: data.user, blocked: null });
              return data;
            }
          }
          throw err;
        }
      },

      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),

      refreshCredits: async () => {
        try {
          const { data } = await api.get('/payment/credits');
          set((s) => ({ user: s.user ? { ...s.user, credits: data.credits } : s.user }));
        } catch {}
      },

      setBlocked: (reason) => set({ blocked: { reason } }),

      clearBlocked: () => set({ blocked: null }),

      logout: () => set({ token: null, user: null, blocked: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ token: s.token, user: s.user }),
      // don't persist blocked — always re-check on load
    }
  )
);
