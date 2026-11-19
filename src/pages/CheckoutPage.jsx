import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCartStore } from '@/store/cartStore.js'
import { useClientAuthStore } from '@/store/clientAuthStore.js'
import { orderService } from '@/services/orderService.js'
import api from '@/services/api.js'
import { useNavigate } from 'react-router-dom'
import Input from '@/components/common/Input.jsx'
import PaymentSelector from '@/components/checkout/PaymentSelector.jsx'
import Button from '@/components/common/Button.jsx'
import { Helmet } from 'react-helmet-async'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { User, CheckCircle, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useFbPixel } from '@/hooks/useFbPixel.js'

const nameRegex  = /^[a-zA-ZÀ-ÿ\s'\-]+$/
const phoneRegex = /^(\+221)?(70|75|76|77|78)\d{7}$/

const schemaConnected = z.object({
  address:        z.string().min(10, 'Adresse trop courte').max(300),
  payment_method: z.enum(['paydunya', 'livraison'], { required_error: 'Choisissez un mode de paiement' }),
})

const schemaGuest = z.object({
  first_name:     z.string().min(2).max(100).regex(nameRegex, 'Lettres uniquement'),
  phone:          z.string().regex(phoneRegex, 'Numéro invalide — ex: 77 123 45 67'),
  address:        z.string().min(10, 'Adresse trop courte').max(300),
  payment_method: z.enum(['paydunya', 'livraison'], { required_error: 'Choisissez un mode de paiement' }),
})

export default function CheckoutPage() {
  const { items, clearCart }        = useCartStore()
  const { client, isAuthenticated } = useClientAuthStore()
  const navigate                    = useNavigate()
  const [loading, setLoading]       = useState(false)
  const [showWarning, setShowWarning] = useState(true)

  const { initiateCheckout, purchase } = useFbPixel()

  const schema = isAuthenticated ? schemaConnected : schemaGuest

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { payment_method: 'paydunya' }
  })

  const paymentMethod = watch('payment_method')
  const total = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)

  // ── Pixel : InitiateCheckout dès l'arrivée ────────────────────
  useEffect(() => {
    if (items.length) initiateCheckout(items, total)
  }, [])

  if (!items.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <ShoppingCart size={48} className="text-gray-200" />
        <p className="text-gray-400 font-medium">Votre panier est vide</p>
        <Link to="/" className="btn-primary px-6 py-3">Voir les produits</Link>
      </div>
    )
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const customer = isAuthenticated
        ? { first_name: client.first_name, phone: client.phone, address: data.address }
        : { first_name: data.first_name, phone: data.phone, address: data.address }

      const orderPayload = {
        customer,
        items: items.map(i => ({
          product_id:    i.id,
          product_name:  i.name,
          product_image: i.imagekit_images?.[0]?.url || null,
          quantity:      Number(i.quantity),
          unit_price:    Number(i.price),
        })),
        payment_method:   data.payment_method,
        subtotal:         total,
        delivery_fee:     0,
        total,
        delivery_address: data.address,
        status: data.payment_method === 'paydunya' ? 'en_attente_paiement' : 'en_attente',
      }

      const order = await orderService.create(orderPayload)

      if (data.payment_method === 'paydunya') {
        const { data: pd } = await api.post('/payments/paydunya/create', { order_id: order.id })
        if (!pd?.success || !pd?.payment_url) {
          toast.error("Impossible d'initialiser le paiement. Réessayez.")
          return
        }
        sessionStorage.setItem('last_order', JSON.stringify({
          orderId: order.id, orderNumber: order.order_number, total,
          items: items.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price }))
        }))
        clearCart()
        window.location.href = pd.payment_url

      } else {
        // ── Pixel : Purchase immédiat pour paiement à la livraison ──
        purchase(order.id, items, total)

        sessionStorage.setItem('last_order', JSON.stringify({
          orderId: order.id, orderNumber: order.order_number, total,
          items: items.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price }))
        }))
        clearCart()
        navigate(`/commande/success?order=${order.order_number}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet><title>Commander — Sunulunettes</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-800 mb-6">
          Finaliser la commande
        </h1>

        {/* ── Bannière avertissement ── */}
        {showWarning && (
          <div className="relative mb-6 p-5 bg-red-50 border-2 border-red-400 rounded-2xl shadow-md">
            <div className="flex items-start gap-3">
              <span className="text-3xl shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="font-black text-red-700 text-base mb-2">
                  Lisez attentivement avant de commander !
                </p>
                <p className="text-red-700 text-sm leading-relaxed">
                  Ne cliquez sur <strong>« Confirmer la commande »</strong> que si vous êtes prêt(e) à recevoir
                  votre commande demain. <strong>Ne faites pas de test.</strong> Si vous confirmez,
                  le livreur vous appellera sur le numéro que vous avez fourni.
                  Merci de bien respecter ces consignes. 🙏
                </p>
              </div>
              <button onClick={() => setShowWarning(false)}
                className="text-red-300 hover:text-red-500 text-xl font-bold transition leading-none shrink-0">
                ×
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          <div className="lg:col-span-3 space-y-4">
            {isAuthenticated ? (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={18} className="text-green-500" />
                  <h2 className="font-bold text-gray-700">Vos informations</h2>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-primary-700 font-black text-sm">
                      {client.first_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{client.first_name}</p>
                    <p className="text-xs text-gray-400">{client.phone}</p>
                  </div>
                  <span className="ml-auto text-xs bg-green-100 text-green-600 font-semibold px-2 py-1 rounded-full">
                    Connecté
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Adresse de livraison *</label>
                  <textarea rows={3} placeholder="Quartier, rue, point de repère..."
                    {...register('address')}
                    className={`input-field resize-none ${errors.address ? 'border-red-400' : ''}`} />
                  {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
                </div>
              </div>
            ) : (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-gray-400" />
                    <h2 className="font-bold text-gray-700">Vos informations</h2>
                  </div>
                  <Link to="/inscription" className="text-xs text-primary-600 hover:underline font-medium">
                    Créer un compte →
                  </Link>
                </div>
                <div className="space-y-4">
                  <Input label="Prénom *" placeholder="Moussa"
                    {...register('first_name')} error={errors.first_name?.message} autoFocus />
                  <Input label="Téléphone *" type="tel" placeholder="77 123 45 67"
                    {...register('phone')} error={errors.phone?.message} />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Adresse de livraison *</label>
                    <textarea rows={3} placeholder="Quartier, rue, point de repère..."
                      {...register('address')}
                      className={`input-field resize-none ${errors.address ? 'border-red-400' : ''}`} />
                    {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
                  </div>
                  <div className="p-3 bg-primary-50 border border-primary-100 rounded-xl text-xs text-primary-700">
                    💡 <Link to="/inscription" className="font-semibold underline">Créez un compte</Link> pour
                    ne plus ressaisir vos infos et suivre vos commandes facilement.
                  </div>
                </div>
              </div>
            )}

            <div className="card p-5">
              <Controller name="payment_method" control={control}
                render={({ field }) => (
                  <PaymentSelector value={field.value} onChange={field.onChange}
                    error={errors.payment_method?.message} />
                )}
              />
            </div>

            {paymentMethod === 'paydunya' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                <span className="text-base">⚠️</span>
                <p>La commande sera <strong>confirmée uniquement après paiement</strong>.
                Vous serez redirigé vers PayDunya pour payer en toute sécurité.</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="card p-5 sticky top-24">
              <h2 className="font-bold text-gray-700 text-lg mb-4">Récapitulatif</h2>
              <div className="space-y-2 mb-4 max-h-52 overflow-y-auto pr-1 border-b pb-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm gap-2">
                    <span className="text-gray-600 truncate">
                      {item.name} <span className="font-medium">×{item.quantity}</span>
                    </span>
                    <span className="font-semibold shrink-0">
                      {(Number(item.price) * Number(item.quantity)).toLocaleString()} FCFA
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center font-black text-xl text-gray-800 mb-5">
                <span>Total</span>
                <span className="text-primary-700">{total.toLocaleString()} FCFA</span>
              </div>
              <Button type="submit" loading={loading} className="w-full py-4 text-base">
                {paymentMethod === 'paydunya' ? '💳 Payer maintenant' : '✅ Confirmer la commande'}
              </Button>
              <p className="text-xs text-center text-gray-400 mt-3">
                {paymentMethod === 'paydunya'
                  ? '🔒 Paiement sécurisé — Wave, Orange Money, Carte'
                  : '💵 Paiement en espèces à la réception'}
              </p>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
