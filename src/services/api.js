import axios from 'axios'
import { useAuthStore } from '@/store/authStore.js'
import { useClientAuthStore } from '@/store/clientAuthStore.js'

// ✅ URL hardcodée en fallback si VITE_API_URL absent
const BASE_URL = import.meta.env.VITE_API_URL || 'https://ma-boutique-backend.vercel.app/api'

console.log('[API] baseURL:', BASE_URL)

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const adminToken  = useAuthStore.getState().token
  const clientToken = useClientAuthStore.getState().token
  const token = adminToken || clientToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAdminRoute = error.config?.url?.includes('/auth/')
      if (isAdminRoute) {
        useAuthStore.getState().logout()
        window.location.href = '/admin/login'
      } else {
        useClientAuthStore.getState().logout()
      }
    }
    return Promise.reject(error)
  }
)

export default api