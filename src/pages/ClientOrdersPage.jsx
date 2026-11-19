import { useQuery } from '@tanstack/react-query'
import { clientAuthService } from '@/services/clientAuthService.js'
import { useClientAuthStore } from '@/store/clientAuthStore.js'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Spinner from '@/components/common/Spinner.jsx'
import EmptyState from '@/components/common/EmptyState.jsx'
import { Package, ChevronRight, LogOut } from 'lucide-react'

const STATUS_STYLES = {
  en_attente: { color: 'bg-yellow-100 text-yellow-700', label: '⏳ En attente' },
  paye:       { color: 'bg-blue-100 text-blue-700',     label: '💳 Payé' },
  valide:     { color: 'bg-purple-100 text-purple-700', label: '✅ Validé' },
  expedie:    { color: 'bg-indigo-100 text-indigo-700', label: '🚚 Expédié' },
  livre:      { color: 'bg-green-100 text-green-700',   label: '🎉 Livré' },
  annule:     { color: 'bg-red-100 text-red-500',       label: '❌ Annulé' },
}

const PAYMENT_LABELS = {
  livraison:    '💵 Paiement à la livraison',
  wave:         '🌊 Wave',
  orange_money: '🟠 Orange Money',
}

export default function ClientOrdersPage() {
  const { client, logout } = useClientAuthStore()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['client-orders'],
    queryFn: clientAuthService.orders,
  })

  const orders = data?.orders || []

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <Helmet><title>Mes commandes — Ma Boutique</title></Helmet>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-800">Mes commandes</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Bonjour, <span className="font-semibold text-gray-600">{client?.first_name}</span> 👋
            </p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition px-3 py-2 hover:bg-red-50 rounded-xl">
            <LogOut size={15} /> Déconnexion
          </button>
        </div>

        {isLoading ? (
          <Spinner className="py-20" />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Aucune commande"
            description="Vous n'avez pas encore passé de commande."
            action={<Link to="/" className="btn-primary">Découvrir nos produits</Link>}
          />
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const st = STATUS_STYLES[order.status] || { color: 'bg-gray-100 text-gray-600', label: order.status }
              const items = order.order_items || []
              return (
                <div key={order.id} className="card p-4 sm:p-5">
                  {/* En-tête commande */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-mono font-bold text-primary-600 text-sm">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  {/* Produits */}
                  <div className="space-y-2 mb-3">
                    {items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {item.product_image ? (
                          <img src={item.product_image} alt={item.product_name}
                            className="w-10 h-10 object-cover rounded-lg shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            <Package size={16} className="text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{item.product_name}</p>
                          <p className="text-xs text-gray-400">×{item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-700 shrink-0">
                          {Number(item.total_price).toLocaleString()} FCFA
                        </p>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="text-xs text-gray-400 pl-12">+{items.length - 3} autre(s) article(s)</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-400">{PAYMENT_LABELS[order.payment_method]}</p>
                      <p className="font-black text-primary-700">
                        {Number(order.total).toLocaleString()} FCFA
                      </p>
                    </div>
                    {/* Message statut */}
                    <div className="text-right">
                      {order.status === 'en_attente' && (
                        <p className="text-xs text-yellow-600 font-medium">En cours de traitement</p>
                      )}
                      {order.status === 'expedie' && (
                        <p className="text-xs text-indigo-600 font-medium">En route vers vous !</p>
                      )}
                      {order.status === 'livre' && (
                        <p className="text-xs text-green-600 font-medium">Commande reçue ✓</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="btn-secondary text-sm py-2 px-5">
            ← Continuer vos achats
          </Link>
        </div>
      </div>
    </>
  )
}
