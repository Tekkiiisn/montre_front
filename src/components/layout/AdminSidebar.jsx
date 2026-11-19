import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, LogOut, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore.js'
import { useState } from 'react'
import { clsx } from 'clsx'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/produits', label: 'Produits', icon: Package },
  { to: '/admin/avis', label: 'Avis', icon: Reviews },
  { to: '/admin/commandes', label: 'Commandes', icon: ShoppingBag },
]

export default function AdminSidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore(s => s.logout)
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => { logout(); navigate('/admin/login') }

  return (
    <aside className={clsx('bg-primary-900 text-white flex flex-col transition-all duration-300', collapsed ? 'w-16' : 'w-60')}>
      <div className="flex items-center justify-between p-4 border-b border-primary-700">
        {!collapsed && <span className="font-bold text-lg">🛍️ Admin</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-primary-700 rounded-lg ml-auto">
          <ChevronLeft size={18} className={clsx('transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to)
          return (
            <Link key={to} to={to}
              className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl transition font-medium text-sm',
                active ? 'bg-white text-primary-700' : 'text-primary-200 hover:bg-primary-700'
              )}
            >
              <Icon size={20} />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300 hover:bg-red-900/30 transition w-full text-sm"
        >
          <LogOut size={20} />
          {!collapsed && 'Déconnexion'}
        </button>
      </div>
    </aside>
  )
}
