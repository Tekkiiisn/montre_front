import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useClientAuthStore = create(
  persist(
    (set) => ({
      client: null,
      token: null,
      isAuthenticated: false,

      login: (token, client) => set({ token, client, isAuthenticated: true }),

      logout: () => set({ token: null, client: null, isAuthenticated: false }),

      updateClient: (client) => set({ client }),
    }),
    {
      name: 'boutique-client-auth',
      partialize: (s) => ({ token: s.token, client: s.client, isAuthenticated: s.isAuthenticated })
    }
  )
)
