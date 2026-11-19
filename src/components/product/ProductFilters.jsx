import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react'
import api from '@/services/api.js'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Plus récents' },
  { value: 'price_asc',  label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'popular',    label: 'Populaires' },
]

const DEFAULT_FILTERS = {
  q:           '',
  category_id: '',
  min_price:   '',
  max_price:   '',
  sort:        'newest',
}

export default function ProductFilters({ filters = DEFAULT_FILTERS, onChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sortOpen, setSortOpen]         = useState(false)
  const sortRef = useRef(null)

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data)
  })
  const categories = Array.isArray(categoriesData) ? categoriesData : []

  useEffect(() => {
    const h = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const safeFilters = { ...DEFAULT_FILTERS, ...filters }

  const activePriceCount = [
    safeFilters.min_price,
    safeFilters.max_price,
    safeFilters.sort && safeFilters.sort !== 'newest',
  ].filter(Boolean).length

  const clearAll = () => onChange({ ...DEFAULT_FILTERS, q: safeFilters.q })
  const update   = (patch) => onChange({ ...safeFilters, ...patch })
  const currentSort = SORT_OPTIONS.find(o => o.value === (safeFilters.sort || 'newest'))

  return (
    <div className="mb-6 space-y-3">

      {/* ── Barre de recherche ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={safeFilters.q}
            onChange={e => update({ q: e.target.value })}
            placeholder="Rechercher un produit..."
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-gray-200
              rounded-xl outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100
              transition placeholder:text-gray-400"
          />
          {safeFilters.q && (
            <button onClick={() => update({ q: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort dropdown desktop */}
        <div className="relative hidden sm:block" ref={sortRef}>
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium
              bg-white border border-gray-200 rounded-xl hover:border-primary-300
              transition whitespace-nowrap text-gray-700"
          >
            <span className="text-gray-400 text-xs">Trier :</span>
            {currentSort?.label}
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl
                  shadow-xl border border-gray-100 overflow-hidden z-30"
              >
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => { update({ sort: opt.value }); setSortOpen(false) }}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-sm
                      transition hover:bg-gray-50
                      ${safeFilters.sort === opt.value ? 'text-primary-600 font-semibold' : 'text-gray-700'}`}
                  >
                    {opt.label}
                    {safeFilters.sort === opt.value && <Check size={14} />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bouton filtres avancés (prix uniquement) */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium
            rounded-xl border transition whitespace-nowrap
            ${showAdvanced || activePriceCount > 0
              ? 'bg-primary-600 border-primary-600 text-white'
              : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'}`}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Prix & tri</span>
          {activePriceCount > 0 && (
            <span className="text-xs font-black w-4 h-4 rounded-full bg-white text-primary-600
              flex items-center justify-center leading-none">
              {activePriceCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Catégories en pills directement visibles ── */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => update({ category_id: '' })}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition
              ${!safeFilters.category_id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}
          >
            Tout
          </button>
          {categories.map(cat => (
            <button key={cat.id}
              onClick={() => update({ category_id: safeFilters.category_id === cat.id ? '' : cat.id })}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition
                ${safeFilters.category_id === cat.id
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Filtres avancés prix + tri mobile ── */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Prix min (FCFA)</p>
                  <input type="number" min="0" placeholder="0"
                    value={safeFilters.min_price}
                    onChange={e => update({ min_price: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200
                      rounded-xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Prix max (FCFA)</p>
                  <input type="number" min="0" placeholder="999999"
                    value={safeFilters.max_price}
                    onChange={e => update({ max_price: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200
                      rounded-xl focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition"
                  />
                </div>
                {/* Sort mobile */}
                <div className="sm:hidden">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trier par</p>
                  <select value={safeFilters.sort}
                    onChange={e => update({ sort: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none">
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {activePriceCount > 0 && (
                <div className="flex justify-end">
                  <button onClick={clearAll}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 font-semibold transition">
                    <X size={13} /> Effacer les filtres
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tags filtres actifs ── */}
      {(safeFilters.min_price || safeFilters.max_price || (safeFilters.sort && safeFilters.sort !== 'newest')) && (
        <div className="flex flex-wrap gap-2">
          {safeFilters.min_price && (
            <ActiveTag label={`Min ${Number(safeFilters.min_price).toLocaleString()} FCFA`}
              onRemove={() => update({ min_price: '' })} />
          )}
          {safeFilters.max_price && (
            <ActiveTag label={`Max ${Number(safeFilters.max_price).toLocaleString()} FCFA`}
              onRemove={() => update({ max_price: '' })} />
          )}
          {safeFilters.sort && safeFilters.sort !== 'newest' && (
            <ActiveTag label={SORT_OPTIONS.find(o => o.value === safeFilters.sort)?.label}
              onRemove={() => update({ sort: 'newest' })} />
          )}
        </div>
      )}
    </div>
  )
}

function ActiveTag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50
      border border-primary-200 text-primary-700 text-xs font-semibold rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-primary-900 transition">
        <X size={11} />
      </button>
    </span>
  )
}
