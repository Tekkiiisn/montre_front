import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const calcTotal = (items) =>
  items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)

const calcCount = (items) =>
  items.reduce((sum, i) => sum + Number(i.quantity), 0)

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,
      isOpen: false,

      addItem: (product, quantity = 1) => {
        const items = get().items
        const existing = items.find(i => i.id === product.id)
        let newItems
        if (existing) {
          newItems = items.map(i =>
            i.id === product.id
              ? { ...i, quantity: Math.min(i.quantity + quantity, i.stock) }
              : i
          )
        } else {
          newItems = [...items, { ...product, quantity: Number(quantity) }]
        }
        set({ items: newItems, total: calcTotal(newItems), itemCount: calcCount(newItems), isOpen: true })
      },

      removeItem: (id) => {
        const newItems = get().items.filter(i => i.id !== id)
        set({ items: newItems, total: calcTotal(newItems), itemCount: calcCount(newItems) })
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) { get().removeItem(id); return }
        const newItems = get().items.map(i =>
          i.id === id ? { ...i, quantity: Math.min(Number(quantity), i.stock) } : i
        )
        set({ items: newItems, total: calcTotal(newItems), itemCount: calcCount(newItems) })
      },

      clearCart: () => set({ items: [], total: 0, itemCount: 0 }),
      openCart:  () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'boutique-cart',
      partialize: (s) => ({ items: s.items }),
      // Recalcule total et itemCount à la réhydratation depuis localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.total     = calcTotal(state.items)
          state.itemCount = calcCount(state.items)
        }
      }
    }
  )
)