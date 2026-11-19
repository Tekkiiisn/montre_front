import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore.js'
import CartItem from './CartItem.jsx'

export default function CartDrawer() {
  const { isOpen, closeCart, items, total } = useCartStore()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeCart} />
          <motion.div
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <div className="flex items-center gap-2 font-bold text-lg">
                <ShoppingCart /> Panier ({items.length})
              </div>
              <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-xl"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart size={48} className="text-gray-300 mb-4" />
                  <p className="text-gray-500">Votre panier est vide</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(item => <CartItem key={item.id} item={item} />)}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-between font-bold text-xl mb-4">
                  <span>Total</span>
                  <span className="text-primary-700">{total.toLocaleString()} FCFA</span>
                </div>
                <Link to="/commande" onClick={closeCart} className="btn-primary w-full block text-center">
                  Commander
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}