import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  token: sessionStorage.getItem('admin_token') || null,
  user: null,
  isAuthenticated: !!sessionStorage.getItem('admin_token'),

  login: (token, user) => {
    sessionStorage.setItem('admin_token', token)
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    sessionStorage.removeItem('admin_token')
    set({ token: null, user: null, isAuthenticated: false })
  },
}))