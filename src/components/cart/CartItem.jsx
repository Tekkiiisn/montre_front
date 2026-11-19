import { Trash2, Plus, Minus } from 'lucide-react'
import { useCartStore } from '@/store/cartStore.js'

export default function CartItem({ item }) {
  const { removeItem, updateQuantity } = useCartStore()
  const image = item.cloudinary_images?.[0]?.url || 'https://via.placeholder.com/80'

  return (
    <div className="flex gap-3 bg-white p-3 rounded-xl border border-gray-100">
      <img src={image} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-800 truncate">{item.name}</p>
        <p className="text-primary-600 font-bold text-sm">{item.price.toLocaleString()} FCFA</p>
        <div className="flex items-center gap-2 mt-2">
          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="p-1 rounded-lg border hover:bg-gray-100"><Minus size={14} /></button>
          <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
            className="p-1 rounded-lg border hover:bg-gray-100 disabled:opacity-40"><Plus size={14} /></button>
        </div>
      </div>
      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1 shrink-0">
        <Trash2 size={18} />
      </button>
    </div>
  )
}