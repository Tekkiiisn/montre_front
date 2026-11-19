import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore.js'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'

export default function CartPage() {
  const items          = useCartStore(s => s.items)
  const removeItem     = useCartStore(s => s.removeItem)
  const updateQuantity = useCartStore(s => s.updateQuantity)
  const clearCart      = useCartStore(s => s.clearCart)

  // Calcul local — toujours juste peu importe le store
  const total = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)

  if (items.length === 0) {
    return (
      <>
        <Helmet><title>Panier — Ma Boutique</title></Helmet>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <ShoppingCart size={80} className="text-gray-200 mb-6" />
          <h1 className="text-2xl font-black text-gray-700 mb-3">Votre panier est vide</h1>
          <p className="text-gray-400 mb-8">Ajoutez des produits pour commencer.</p>
          <Link to="/" className="btn-primary">Découvrir nos produits</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet><title>Panier ({items.length}) — Ma Boutique</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800">
            Mon panier <span className="text-primary-600">({items.length})</span>
          </h1>
          <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-600 underline">
            Vider le panier
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Articles */}
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence>
              {items.map(item => {
                const image = item.imagekit_images?.[0]?.url
                const subtotal = Number(item.price) * Number(item.quantity)
                return (
                  <motion.div key={item.id} layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="card p-4 flex gap-4"
                  >
                    {image
                      ? <img src={image} alt={item.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl shrink-0" />
                      : <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl shrink-0 flex items-center justify-center">
                          <ShoppingCart size={28} className="text-gray-300" />
                        </div>
                    }

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 leading-tight line-clamp-2">{item.name}</h3>
                      <p className="text-primary-600 font-bold mt-1">
                        {Number(item.price).toLocaleString()} FCFA
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-100 transition">
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center font-bold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed">
                          <Plus size={14} />
                        </button>
                        <span className="text-xs text-gray-400 ml-1">{item.stock} dispo</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between shrink-0">
                      <button onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 p-1 transition">
                        <Trash2 size={18} />
                      </button>
                      <div className="text-right">
                        <p className="font-black text-gray-800">
                          {subtotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">FCFA</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-24">
              <h2 className="font-bold text-gray-700 text-lg mb-4">Récapitulatif</h2>

              <div className="space-y-2 mb-4 text-sm border-b pb-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between gap-2 text-gray-600">
                    <span className="truncate">{item.name} ×{item.quantity}</span>
                    <span className="shrink-0 font-medium">
                      {(Number(item.price) * Number(item.quantity)).toLocaleString()} FCFA
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-black text-xl text-gray-800 mb-5">
                <span>Total</span>
                <span className="text-primary-700">{total.toLocaleString()} FCFA</span>
              </div>

              <Link to="/commande" className="btn-primary w-full block text-center py-4 text-base">
                Commander →
              </Link>
              <Link to="/" className="text-center block mt-3 text-sm text-gray-400 hover:text-primary-600">
                ← Continuer vos achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
