import { Truck, Check } from 'lucide-react'

export default function PaymentSelector({ value, onChange, error }) {
  // Une seule option : on force la valeur "livraison" si le parent ne l'a pas encore définie
  useEffect(() => {
    if (value !== 'livraison') onChange('livraison')
  }, [value, onChange])

  return (
    <div>
      <h2 className="font-bold text-gray-700 mb-3">Mode de paiement</h2>

      <div className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-primary-500 bg-primary-50">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary-600">
          <Truck size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-primary-700">Paiement à la livraison</p>
          <p className="text-xs text-gray-500">Payez en espèces à la réception de votre commande</p>
        </div>
        <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
          <Check size={12} className="text-white" strokeWidth={3} />
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
