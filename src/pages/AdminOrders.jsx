import { useQuery } from '@tanstack/react-query'
import { orderService } from '@/services/orderService.js'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Eye, Phone, MapPin } from 'lucide-react'
import Spinner from '@/components/common/Spinner.jsx'
import EmptyState from '@/components/common/EmptyState.jsx'

const STATUS_STYLES = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  paye:       'bg-blue-100 text-blue-700',
  valide:     'bg-purple-100 text-purple-700',
  expedie:    'bg-indigo-100 text-indigo-700',
  livre:      'bg-green-100 text-green-700',
  annule:     'bg-red-100 text-red-600',
}

const STATUS_LABELS = {
  en_attente: '⏳ En attente',
  paye:       '💳 Payé',
  valide:     '✅ Validé',
  expedie:    '🚚 Expédié',
  livre:      '🎉 Livré',
  annule:     '❌ Annulé',
}

const PAYMENT_LABELS = {
  livraison:    '💵 Livraison',
  wave:         '🌊 Wave',
  orange_money: '🟠 Orange Money',
}

export default function AdminOrders() {
  const [statusFilter, setStatusFilter]   = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter, paymentFilter],
    queryFn: () => orderService.getAll({
      status: statusFilter || undefined,
      payment_method: paymentFilter || undefined
    })
  })

  const orders = data?.orders || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-800">
          Commandes
          {orders.length > 0 && (
            <span className="ml-2 text-base font-normal text-gray-400">({orders.length})</span>
          )}
        </h1>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-field text-sm py-2 flex-1 min-w-[150px]"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          className="input-field text-sm py-2 flex-1 min-w-[150px]"
        >
          <option value="">Tous les paiements</option>
          <option value="livraison">💵 Livraison</option>
          <option value="wave">🌊 Wave</option>
          <option value="orange_money">🟠 Orange Money</option>
        </select>

        {(statusFilter || paymentFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setPaymentFilter('') }}
            className="text-sm text-red-400 hover:text-red-600 underline px-2"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {isLoading ? (
        <Spinner className="py-20" />
      ) : orders.length === 0 ? (
        <EmptyState icon="📦" title="Aucune commande" description="Les commandes apparaîtront ici." />
      ) : (
        <>
          {/* Vue mobile — cartes */}
          <div className="space-y-3 lg:hidden">
            {orders.map(order => {
              const customer = order.customers || {}
              return (
                <div key={order.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono font-bold text-primary-600 text-sm">{order.order_number}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLES[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <p className="font-semibold text-gray-800">
                      {customer.first_name} {customer.last_name}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Phone size={13} />
                      <a href={`tel:${customer.phone}`} className="hover:text-primary-600">{customer.phone}</a>
                    </div>
                    <div className="flex items-start gap-1 text-sm text-gray-500">
                      <MapPin size={13} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{order.delivery_address}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">{PAYMENT_LABELS[order.payment_method]}</p>
                      <p className="font-black text-primary-700">{Number(order.total).toLocaleString()} FCFA</p>
                    </div>
                    <Link
                      to={`/admin/commandes/${order.id}`}
                      className="btn-primary py-2 px-4 text-sm flex items-center gap-1"
                    >
                      <Eye size={15} /> Voir
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Vue desktop — tableau */}
          <div className="card overflow-hidden hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">N° Commande</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Client</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Téléphone</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Adresse</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Paiement</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Total</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Statut</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Date</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(order => {
                    const customer = order.customers || {}
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-primary-600 text-xs">
                            {order.order_number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800">
                            {customer.first_name} {customer.last_name}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`tel:${customer.phone}`}
                            className="text-primary-600 hover:underline font-medium"
                          >
                            {customer.phone}
                          </a>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="text-gray-600 text-xs truncate">{order.delivery_address}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {PAYMENT_LABELS[order.payment_method]}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-black text-primary-700">
                            {Number(order.total).toLocaleString()} FCFA
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLES[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/admin/commandes/${order.id}`}
                            className="flex items-center gap-1 text-primary-600 hover:text-primary-800 font-semibold text-xs"
                          >
                            <Eye size={15} /> Détail
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}