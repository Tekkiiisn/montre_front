import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '@/services/api.js'
import Spinner from '@/components/common/Spinner.jsx'
import { TrendingUp, ShoppingBag, Package, DollarSign, Eye } from 'lucide-react'

const STATUS_STYLES = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  paye:       'bg-blue-100 text-blue-700',
  valide:     'bg-purple-100 text-purple-700',
  expedie:    'bg-indigo-100 text-indigo-700',
  livre:      'bg-green-100 text-green-700',
  annule:     'bg-red-100 text-red-500',
}
const STATUS_LABELS = {
  en_attente: '⏳ En attente',
  paye:       '💳 Payé',
  valide:     '✅ Validé',
  expedie:    '🚚 Expédié',
  livre:      '🎉 Livré',
  annule:     '❌ Annulé',
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card p-4 sm:p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-black text-gray-800 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    // ✅ On récupère data.stats, data.recentOrders, data.topProducts
    queryFn: () => api.get('/dashboard').then(r => r.data),
    refetchInterval: 30000,
  })

  if (isLoading) return <Spinner className="py-20" />

  // ✅ Fix : lire data.stats (pas data directement)
  const stats        = data?.stats        || {}
  const recentOrders = data?.recentOrders || []

  const revenue_total  = Number(stats.revenue_total  || 0)
  const revenue_today  = Number(stats.revenue_today  || 0)
  const orders_total   = Number(stats.orders_total   || 0)
  const orders_today   = Number(stats.orders_today   || 0)
  const orders_pending = Number(stats.orders_pending || 0)

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard
          icon={DollarSign}
          label="Revenus totaux (payés)"
          value={`${revenue_total.toLocaleString()} FCFA`}
          sub={`Aujourd'hui : ${revenue_today.toLocaleString()} FCFA`}
          color="bg-green-500"
        />
        <StatCard
          icon={ShoppingBag}
          label="Commandes totales"
          value={orders_total}
          sub={`Aujourd'hui : ${orders_today}`}
          color="bg-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label="En attente"
          value={orders_pending}
          sub="À traiter"
          color="bg-yellow-500"
        />
        <StatCard
          icon={Package}
          label="Cette semaine"
          value={Number(stats.orders_week || 0)}
          sub="commandes"
          color="bg-purple-500"
        />
      </div>

      {/* Dernières commandes */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold text-gray-700">Dernières commandes</span>
          <Link to="/admin/commandes"
            className="text-xs text-primary-600 hover:underline font-medium">
            Voir tout →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-gray-400 text-sm p-6 text-center">Aucune commande pour le moment</p>
        ) : (
          <>
            {/* Desktop tableau */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">N° commande</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Client</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Total</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Statut</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map(o => {
                    const customer = o.customers || {}
                    return (
                      <tr key={o.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary-600">
                          {o.order_number}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-700">
                          {customer.first_name} {customer.last_name}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-800">
                          {Number(o.total).toLocaleString()} FCFA
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[o.status] || o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(o.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/admin/commandes/${o.id}`}
                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-semibold">
                            <Eye size={13} /> Voir
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cartes */}
            <div className="sm:hidden divide-y">
              {recentOrders.map(o => {
                const customer = o.customers || {}
                return (
                  <Link key={o.id} to={`/admin/commandes/${o.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 transition">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-bold text-primary-600">{o.order_number}</p>
                      <p className="font-medium text-sm text-gray-700 truncate">
                        {customer.first_name} {customer.last_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(o.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-gray-800 text-sm">
                        {Number(o.total).toLocaleString()} FCFA
                      </p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}