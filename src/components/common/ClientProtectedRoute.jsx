import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useClientAuthStore } from '@/store/clientAuthStore.js'

export default function ClientProtectedRoute() {
  const isAuthenticated = useClientAuthStore(s => s.isAuthenticated)
  const location = useLocation()

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/connexion" state={{ from: location.pathname }} replace />
}
