import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, MapPin, Truck, Smartphone, Loader2, CheckCircle2 } from 'lucide-react'
import { orderService } from '@/services/orderService.js'
import { useFbPixel } from '@/hooks/useFbPixel.js'
import { toast } from 'react-toastify'

const phoneRegex = /^(\+221)?(70|75|76|77|78)\d{7}$/
const nameRegex = /^[a-zA-ZÀ-ÿ\s'\-]+$/

const quickBuySchema = z.object({
  first_name: z.string().min(2, 'Trop court').regex(nameRegex, 'Lettres uniquement'),
  phone: z.string().regex(phoneRegex, 'Numéro invalide (ex: 77 123 45 67)'),
  address: z.string().min(10, 'Adresse plus précise (quartier, repère...)'),
  payment_method: z.enum(['livraison', 'wave', 'orange_money']),
})

const PAYMENT_OPTIONS = [
  { value: 'livraison', label: 'Paiement à la livraison', icon: Truck, hint: 'Payez cash quand vous recevez' },
]

export default function QuickBuyModal({ product, quantity, onClose }) {
  const [step, setStep] = useState('form') // 'form' | 'success'
  const [loading, setLoading] = useState(false)
  const [orderNumber, setOrderNumber] = useState(null)
  const { purchase } = useFbPixel()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(quickBuySchema),
    defaultValues: { payment_method: 'livraison' },
  })

  const paymentMethod = watch('payment_method')
  const total = Number(product.price) * quantity

  const onSubmit = async (data) => {
    if (loading) return // évite le double clic
    setLoading(true)
    try {
      const res = await orderService.create({
        customer: {
          first_name: data.first_name,
          phone: data.phone,
          address: data.address,
        },
        items: [{
          product_id: product.id,
          product_name: product.name,
          product_image: product.imagekit_images?.[0]?.url || null,
          quantity,
          unit_price: Number(product.price),
        }],
        payment_method: data.payment_method,
        subtotal: total,
        total,
        delivery_address: data.address,
      })

      const orderId = res.order_number || res.id
      setOrderNumber(res.order_number)
      setStep('success')

      // 🎯 Pixel Facebook : Purchase, une seule fois par commande
      purchase({ product, qty: quantity, orderId, value: total })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la commande')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl
        max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">

        {step === 'success' ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-2">Commande confirmée ! 🎉</h2>
            <p className="text-gray-500 text-sm mb-1">Numéro de commande</p>
            <p className="font-mono font-bold text-primary-600 mb-4">{orderNumber}</p>
            <p className="text-sm text-gray-500 mb-6">
              Nous vous contacterons rapidement au téléphone indiqué pour confirmer la livraison.
            </p>
            <button onClick={onClose} className="btn-primary w-full py-3">
              Continuer
            </button>
          </div>
        ) : (
          <>
            {/* Header sticky */}
            <div className="sticky top-0 bg-white border-b flex items-center justify-between px-5 py-4 z-10">
              <div>
                <h2 className="font-black text-gray-800">Commander maintenant</h2>
                <p className="text-xs text-gray-400 mt-0.5">Livraison partout au Sénégal</p>
              </div>
              <button onClick={onClose} aria-label="Fermer" className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {/* Récap produit */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                {product.imagekit_images?.[0]?.url && (
                  <img src={product.imagekit_images[0].url} alt=""
                    className="w-14 h-14 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">Quantité : {quantity}</p>
                </div>
                <p className="font-black text-primary-700 shrink-0">
                  {total.toLocaleString()} FCFA
                </p>
              </div>

              {/* Identité */}
              <div>
                <input placeholder="Prénom *" {...register('first_name')}
                  className="w-full border rounded-xl px-3 py-3 text-sm focus:border-primary-500 outline-none" />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
              </div>

              <div>
                <input placeholder="Téléphone * (ex: 77 123 45 67)" type="tel" {...register('phone')}
                  className="w-full border rounded-xl px-3 py-3 text-sm focus:border-primary-500 outline-none" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>

              {/* Adresse */}
              <div>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3.5 text-gray-300" />
                  <textarea placeholder="Adresse de livraison * (quartier, rue, repère...)"
                    rows={2} {...register('address')}
                    className="w-full border rounded-xl pl-9 pr-3 py-3 text-sm focus:border-primary-500 outline-none resize-none" />
                </div>
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>

              {/* Paiement */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Mode de paiement</p>
                <div className="space-y-2">
                  {PAYMENT_OPTIONS.map(opt => {
                    const Icon = opt.icon
                    const active = paymentMethod === opt.value
                    return (
                      <button key={opt.value} type="button"
                        onClick={() => setValue('payment_method', opt.value)}
                        className={`w-full flex items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition
                          ${active ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                          ${active ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${active ? 'text-primary-700' : 'text-gray-700'}`}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-gray-400">{opt.hint}</p>
                        </div>
                        {opt.value === 'livraison' && (
                          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">
                            Recommandé
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? 'Validation...' : `Confirmer — ${total.toLocaleString()} FCFA`}
              </button>

              <p className="text-center text-xs text-gray-400">
                🔒 Vos informations sont utilisées uniquement pour la livraison
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
