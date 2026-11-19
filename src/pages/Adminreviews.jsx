import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api.js'
import { productService } from '@/services/productService.js'
import { Star, Trash2, Eye, EyeOff, CheckCircle, Plus, X, Camera } from 'lucide-react'
import { toast } from 'react-toastify'
import Spinner from '@/components/common/Spinner.jsx'

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  )
}

// ── Formulaire avis fictif ────────────────────────────────────
function FakeReviewForm({ products, onSuccess }) {
  const [open, setOpen]     = useState(false)
  const [form, setForm]     = useState({
    product_id: '', author_name: '', rating: 5, comment: '', created_at: ''
  })
  const [images, setImages] = useState([])

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
      images.forEach(img => fd.append('images', img.file))
      const { data } = await api.post('/reviews/admin/fake', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return data
    },
    onSuccess: () => {
      toast.success('Avis ajouté !')
      setForm({ product_id: '', author_name: '', rating: 5, comment: '', created_at: '' })
      setImages([])
      setOpen(false)
      onSuccess?.()
    },
    onError: () => toast.error('Erreur lors de l\'ajout')
  })

  const addImage = (e) => {
    const files = Array.from(e.target.files || [])
    setImages(prev => [...prev, ...files.slice(0, 3 - prev.length).map(f => ({
      file: f, preview: URL.createObjectURL(f)
    }))])
  }

  return (
    <div className="mb-6">
      <button onClick={() => setOpen(o => !o)}
        className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
        <Plus size={16} />
        Ajouter un avis fictif
      </button>

      {open && (
        <div className="mt-4 card p-5 space-y-4">
          <h3 className="font-bold text-gray-700">Nouvel avis fictif</h3>

          <select value={form.product_id}
            onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
            className="input-field w-full text-sm">
            <option value="">Choisir un produit *</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Prénom du client fictif *"
              value={form.author_name}
              onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
              className="input-field text-sm" />

            <select value={form.rating}
              onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
              className="input-field text-sm">
              {[5,4,3,2,1].map(r => (
                <option key={r} value={r}>{'⭐'.repeat(r)} — {r} étoile{r > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <textarea placeholder="Commentaire *" rows={3}
            value={form.comment}
            onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
            className="input-field text-sm w-full resize-none" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Date (optionnel — simule une ancienne date)</label>
              <input type="datetime-local"
                value={form.created_at}
                onChange={e => setForm(f => ({ ...f, created_at: e.target.value }))}
                className="input-field text-sm w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Photos preuves (max 3)</label>
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button type="button"
                      onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <X size={8} />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <label className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-primary-400 transition">
                    <Camera size={16} className="text-gray-300" />
                    <input type="file" accept="image/*" multiple onChange={addImage} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="btn-primary py-2 px-4 text-sm">
              {mutation.isPending ? 'Ajout...' : '✅ Publier'}
            </button>
            <button onClick={() => setOpen(false)}
              className="btn-secondary py-2 px-4 text-sm">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function AdminReviews() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all') // all | pending | visible

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => api.get('/reviews').then(r => r.data),
  })

  const { data: productsData } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productService.getAll({ admin: true }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_visible }) => api.patch(`/reviews/${id}`, { is_visible }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['admin-reviews']); toast.success('Mis à jour') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/reviews/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['admin-reviews']); toast.success('Supprimé') },
  })

  const reviews  = reviewsData?.reviews || []
  const products = productsData?.products || []

  const filtered = reviews.filter(r => {
    if (filter === 'pending') return !r.is_visible
    if (filter === 'visible') return r.is_visible
    return true
  })

  const pending = reviews.filter(r => !r.is_visible).length

  if (isLoading) return <Spinner className="py-20" />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-gray-800">
          Avis clients
          {pending > 0 && (
            <span className="ml-2 text-sm font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              {pending} en attente
            </span>
          )}
        </h1>
      </div>

      {/* Ajouter avis fictif */}
      <FakeReviewForm
        products={products}
        onSuccess={() => qc.invalidateQueries(['admin-reviews'])}
      />

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'all',     label: `Tous (${reviews.length})` },
          { value: 'pending', label: `En attente (${pending})` },
          { value: 'visible', label: `Publiés (${reviews.filter(r => r.is_visible).length})` },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border
              ${filter === f.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm py-10 text-center">Aucun avis</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className={`card p-4 ${!r.is_visible ? 'opacity-70 border-dashed' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-gray-800 text-sm">{r.author_name}</p>
                    {r.is_verified && (
                      <span className="flex items-center gap-0.5 text-xs text-green-600">
                        <CheckCircle size={11} /> Vérifié
                      </span>
                    )}
                    {r.is_fake && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                        Fictif
                      </span>
                    )}
                    {!r.is_visible && (
                      <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-medium">
                        En attente
                      </span>
                    )}
                  </div>

                  <Stars rating={r.rating} />

                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{r.comment}</p>

                  {r.products && (
                    <p className="text-xs text-gray-400 mt-1">📦 {r.products.name}</p>
                  )}

                  {Array.isArray(r.images) && r.images.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {r.images.map((img, i) => (
                        <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
                          <img src={img.url} alt="" className="w-14 h-14 object-cover rounded-xl border" />
                        </a>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(r.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => toggleMutation.mutate({ id: r.id, is_visible: !r.is_visible })}
                    className={`p-2 rounded-lg transition ${r.is_visible
                      ? 'hover:bg-yellow-50 text-yellow-500' : 'hover:bg-green-50 text-green-500'}`}
                    title={r.is_visible ? 'Masquer' : 'Publier'}>
                    {r.is_visible ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    onClick={() => window.confirm('Supprimer cet avis ?') && deleteMutation.mutate(r.id)}
                    className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition"
                    title="Supprimer">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
