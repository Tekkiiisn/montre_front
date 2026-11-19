import { useEffect, useState, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '@/services/api.js'
import { Helmet } from 'react-helmet-async'
import { CheckCircle, ShoppingBag, Home, Loader } from 'lucide-react'
import { useFbPixel } from '@/hooks/useFbPixel.js'

export default function OrderSuccessPage() {
  const [params]    = useSearchParams()
  const orderNumber = params.get('order')
  const token       = params.get('token') || params.get('invoice_token')
  const confirmed   = useRef(false)
  const [status, setStatus] = useState('loading')

  const { purchase } = useFbPixel()

  useEffect(() => {
    const sessionKey = `confirmed_${orderNumber}`
    if (sessionStorage.getItem(sessionKey)) {
      setStatus('paid')
      return
    }
    if (confirmed.current) return
    confirmed.current = true

    const confirm = async () => {
      try {
        let result
        if (token) {
          const { data } = await api.post('/payments/paydunya/confirm', {
            token, order_number: orderNumber,
          })
          result = data
        } else if (orderNumber) {
          const { data } = await api.post('/payments/paydunya/confirm-by-order', {
            order_number: orderNumber,
          })
          result = data
        }

        const isPaid = result?.paid || result?.status === 'completed'
        setStatus(isPaid ? 'paid' : 'pending')

        if (isPaid) {
          sessionStorage.setItem(sessionKey, '1')

          // ── Pixel : Purchase pour paiement PayDunya confirmé ──
          const lastOrder = JSON.parse(sessionStorage.getItem('last_order') || '{}')
          if (lastOrder.orderId) {
            purchase(lastOrder.orderId, lastOrder.items || [], lastOrder.total || 0)
          }
        }
      } catch (err) {
        console.error('[SUCCESS]', err)
        setStatus('pending')
      }
    }

    confirm()
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Vérification du paiement...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet><title>Commande confirmée — Sunulunettes</title></Helmet>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6
            ${status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <CheckCircle size={44} className={status === 'paid' ? 'text-green-500' : 'text-yellow-500'} />
          </div>
          <h1 className="text-2xl font-black text-gray-800 mb-3">
            {status === 'paid' ? 'Paiement réussi ! 🎉' : 'Commande reçue ! 📦'}
          </h1>
          {orderNumber && (
            <p className="text-sm text-gray-400 mb-2">
              N° : <span className="font-mono font-bold text-primary-600">{orderNumber}</span>
            </p>
          )}
          <p className="text-gray-500 mb-8">
            {status === 'paid'
              ? 'Votre paiement a été confirmé. Nous vous contacterons pour la livraison.'
              : 'Votre commande a été reçue. Nous vous contacterons bientôt.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-secondary flex items-center justify-center gap-2 py-3 px-6">
              <Home size={18} /> Accueil
            </Link>
            <Link to="/mes-commandes" className="btn-primary flex items-center justify-center gap-2 py-3 px-6">
              <ShoppingBag size={18} /> Mes commandes
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
