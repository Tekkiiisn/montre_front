import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderService } from '@/services/orderService.js'
import { toast } from 'react-toastify'
import Spinner from '@/components/common/Spinner.jsx'
import { ArrowLeft, Phone, MapPin, Package, CreditCard, Clock, MessageCircle } from 'lucide-react'

const STATUTS = [
   {value:'en_attente_paiement', label:'⏳ Paiement en attente', color: 'bg-orange-100 text-orange-700'  },
  { value: 'en_attente', label: '⏳ En attente',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'paye',       label: '💳 Payé',         color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'valide',     label: '✅ Validé',        color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'expedie',    label: '🚚 Expédié',       color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { value: 'livre',      label: '🎉 Livré',         color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'annule',     label: '❌ Annulé',        color: 'bg-red-100 text-red-600 border-red-200' },
]

const PAYMENT_LABELS = {
  livraison:    '💵 Paiement à la livraison',
  wave:         '🌊 Wave',
  orange_money: '🟠 Orange Money',
}

const PAYMENT_STATUS_COLORS = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  paye:       'bg-green-100 text-green-700',
  echoue:     'bg-red-100 text-red-600',
  rembourse:  'bg-gray-100 text-gray-600',
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getById(id)
  })

  const statusMutation = useMutation({
    mutationFn: (status) => orderService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries(['order', id])
      qc.invalidateQueries(['orders'])
      toast.success('Statut mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour')
  })

  if (isLoading) return <Spinner className="py-20" />
  if (error || !order) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">Commande introuvable</p>
      <button onClick={() => navigate('/admin/commandes')} className="btn-primary">
        Retour
      </button>
    </div>
  )

  const currentStatut = STATUTS.find(s => s.value === order.status)
  const customer = order.customers || order.customer || {}
  const items = order.order_items || order.items || []

  const whatsappNumber = (customer.phone || '')
    .replace(/\D/g, '')
    .replace(/^0/, '221')

  return (
    <div className="w-full max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/commandes')}
          className="p-2 hover:bg-gray-100 rounded-xl transition shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-black text-gray-800 truncate">
            Commande <span className="text-primary-600">#{order.order_number}</span>
          </h1>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Clock size={12} />
            {new Date(order.created_at).toLocaleString('fr-FR', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
        <span className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full border shrink-0 ${currentStatut?.color}`}>
          {currentStatut?.label}
        </span>
      </div>

      {/* Changer statut — barre horizontale scrollable */}
      <div className="card p-3 mb-4 overflow-x-auto">
        <p className="text-xs text-gray-400 font-semibold mb-2 px-1">Changer le statut :</p>
        <div className="flex gap-2 min-w-max">
          {STATUTS.map(s => (
            <button key={s.value}
              onClick={() => s.value !== order.status && statusMutation.mutate(s.value)}
              disabled={statusMutation.isPending}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition whitespace-nowrap
                ${s.value === order.status
                  ? s.color + ' border-current shadow-sm'
                  : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Colonne principale ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Produits */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
              <Package size={16} className="text-primary-600" />
              <h2 className="font-bold text-gray-700 text-sm">
                Produits commandés ({items.length})
              </h2>
            </div>

            <div className="divide-y">
              {items.length === 0 ? (
                <p className="text-gray-400 text-sm p-4">Aucun article</p>
              ) : items.map((item, i) => (
                <div key={item.id || i} className="flex gap-3 p-4">
                  {/* Image */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 border">
                    {item.product_image
                      ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <Package size={22} className="text-gray-300" />
                        </div>
                    }
                  </div>
                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">
                      {item.product_name || 'Produit supprimé'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Prix unitaire : <span className="text-gray-600 font-medium">
                        {Number(item.unit_price).toLocaleString()} FCFA
                      </span>
                    </p>
                    <span className="inline-block mt-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                      × {item.quantity}
                    </span>
                  </div>
                  {/* Total ligne */}
                  <div className="text-right shrink-0">
                    <p className="font-black text-primary-700">
                      {Number(item.total_price || item.unit_price * item.quantity).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">FCFA</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totaux */}
            <div className="bg-gray-50 border-t px-4 py-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Sous-total</span>
                <span>{Number(order.subtotal).toLocaleString()} FCFA</span>
              </div>
              {Number(order.delivery_fee) > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Livraison</span>
                  <span>{Number(order.delivery_fee).toLocaleString()} FCFA</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base text-gray-800 pt-2 border-t">
                <span>TOTAL</span>
                <span className="text-primary-700">{Number(order.total).toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
              <Phone size={16} className="text-primary-600" />
              <h2 className="font-bold text-gray-700 text-sm">Informations client</h2>
            </div>
            <div className="p-4">
              {/* Avatar + nom */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-primary-700 font-black text-sm">
                    {(customer.first_name?.[0] || '?').toUpperCase()}
                    {(customer.last_name?.[0] || '').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-800">
                    {customer.first_name} {customer.last_name}
                  </p>
                  {customer.email && <p className="text-xs text-gray-400">{customer.email}</p>}
                </div>
              </div>

              {/* Grille infos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                  <Phone size={15} className="text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Téléphone</p>
                    <a href={`tel:${customer.phone}`}
                      className="font-semibold text-primary-600 hover:underline text-sm break-all">
                      {customer.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                  <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Adresse</p>
                    <p className="font-semibold text-gray-700 text-sm break-words">
                      {order.delivery_address}
                      {order.delivery_city && `, ${order.delivery_city}`}
                    </p>
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                  <p className="text-xs text-yellow-600 font-semibold mb-1">Note :</p>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Colonne droite ── */}
        <div className="space-y-4">

          {/* Paiement */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
              <CreditCard size={16} className="text-primary-600" />
              <h2 className="font-bold text-gray-700 text-sm">Paiement</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Mode</p>
                <p className="font-semibold text-gray-800 text-sm">
                  {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Statut</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${PAYMENT_STATUS_COLORS[order.payment_status] || 'bg-gray-100'}`}>
                  {order.payment_status}
                </span>
              </div>
              {order.payment_reference && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Référence</p>
                  <p className="font-mono text-xs text-gray-600 break-all">{order.payment_reference}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card p-4 space-y-2">
            <h2 className="font-bold text-gray-700 text-sm mb-3">Actions rapides</h2>
            <a href={`tel:${customer.phone}`}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
              <Phone size={15} /> Appeler
            </a>
            <a href={`https://wa.me/${whatsappNumber}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl bg-green-500 hover:bg-green-600 text-white transition">
              <MessageCircle size={15} /> WhatsApp
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}