import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Menu, X, User, LogOut, Package, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useCartStore } from '@/store/cartStore.js'
import { useClientAuthStore } from '@/store/clientAuthStore.js'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '@/assets/logo.png'

export default function Navbar() {
  const [menuOpen, setMenuOpen]         = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { itemCount, openCart }         = useCartStore()
  const { client, isAuthenticated, logout } = useClientAuthStore()
  const navigate = useNavigate()
  const userRef  = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2 sm:gap-3">

        {/* Logo */}
       <Link to="/" className="shrink-0">
  <img src={logo} alt="Ma Boutique" className="h-8 w-auto" />
</Link>

        <div className="flex-1" />

        <div className="flex items-center gap-1 sm:gap-2">

          {/* Panier */}
          <button onClick={openCart}
            className="relative p-2 hover:bg-gray-100 rounded-xl transition">
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white
                text-xs font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>

          {/* User menu desktop */}
          {isAuthenticated ? (
            <div className="relative hidden sm:block" ref={userRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100
                  rounded-xl transition text-sm font-medium text-gray-700"
              >
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-black text-xs">
                    {client?.first_name?.[0]?.toUpperCase() || 'C'}
                  </span>
                </div>
                <span className="max-w-[80px] truncate">{client?.first_name}</span>
                <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b bg-gray-50">
                      <p className="font-bold text-sm text-gray-800">{client?.first_name} {client?.last_name}</p>
                      <p className="text-xs text-gray-400 truncate">{client?.phone}</p>
                    </div>
                    <Link to="/mes-commandes" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 transition">
                      <Package size={16} /> Mes commandes
                    </Link>
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-sm text-red-500 transition w-full">
                      <LogOut size={16} /> Déconnexion
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1">
              <Link to="/connexion"
                className="px-3 py-1.5 text-sm font-semibold border border-gray-200 text-gray-700 rounded-xl hover:border-primary-400 hover:text-primary-600 transition">
                Connexion
              </Link>
              <Link to="/inscription"
                className="px-3 py-1.5 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition">
                S'inscrire
              </Link>
            </div>
          )}

          {/* Hamburger mobile */}
          <button className="sm:hidden p-2 hover:bg-gray-100 rounded-xl transition"
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sm:hidden border-t bg-white overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-2 mb-1">
                    <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-primary-700 font-black text-sm">
                        {client?.first_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{client?.first_name} {client?.last_name}</p>
                      <p className="text-xs text-gray-400">{client?.phone}</p>
                    </div>
                  </div>
                  <Link to="/mes-commandes" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700">
                    <Package size={16} /> Mes commandes
                  </Link>
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm font-medium text-red-500 w-full">
                    <LogOut size={16} /> Déconnexion
                  </button>
                </>
              ) : (
                <>
                  {/* Les deux boutons au même style, côte à côte */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link to="/connexion" onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center px-3 py-2.5 rounded-xl border-2
                        border-primary-600 text-primary-600 text-sm font-semibold
                        hover:bg-primary-50 transition text-center">
                      Connexion
                    </Link>
                    <Link to="/inscription" onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center px-3 py-2.5 rounded-xl
                        bg-primary-600 text-white text-sm font-semibold
                        hover:bg-primary-700 transition text-center">
                      S'inscrire
                    </Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
