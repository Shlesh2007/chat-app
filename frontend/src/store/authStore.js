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
