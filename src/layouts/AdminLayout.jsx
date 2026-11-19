import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, LogOut, Menu, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore.js'
import { clsx } from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'

const links = [
  { to: '/admin',           label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { to: '/admin/produits',  label: 'Produits',   icon: Package },
  { to: '/admin/commandes', label: 'Commandes',  icon: ShoppingBag },
]

function NavLinks({ onClick }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore(s => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
    onClick?.()
  }

  return (
    <>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to)
          return (
            <Link key={to} to={to} onClick={onClick}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm',
                active
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-primary-100 hover:bg-primary-700'
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-primary-700">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-900/30 transition w-full text-sm font-medium">
          <LogOut size={20} />
          Déconnexion
        </button>
      </div>
    </>
  )
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── Topbar mobile ── */}
      <header className="lg:hidden sticky top-0 z-40 bg-primary-900 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <span className="font-black text-lg">🛍️ Admin</span>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 hover:bg-primary-700 rounded-xl transition"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* ── Drawer mobile ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            {/* Sidebar drawer */}
            <motion.aside
              className="fixed left-0 top-0 h-full w-64 bg-primary-900 z-50 flex flex-col lg:hidden shadow-2xl"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-primary-700">
                <span className="font-black text-white text-lg">🛍️ Admin</span>
                <button onClick={() => setMobileOpen(false)}
                  className="p-2 hover:bg-primary-700 rounded-xl text-white transition">
                  <X size={20} />
                </button>
              </div>
              <NavLinks onClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex">
        {/* ── Sidebar desktop fixe ── */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-60 min-h-screen bg-primary-900 sticky top-0 self-start">
          <div className="px-4 py-5 border-b border-primary-700">
            <span className="font-black text-white text-lg">🛍️ Admin</span>
          </div>
          <NavLinks />
        </aside>

        {/* ── Contenu principal ── */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}