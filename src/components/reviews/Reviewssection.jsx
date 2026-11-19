import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useClientAuthStore } from '@/store/clientAuthStore.js'
import api from '@/services/api.js'
import { Star, Camera, X, CheckCircle, Send, ChevronDown, ChevronUp, Lock } from 'lucide-react'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

function Stars({ rating, size = 16, interactive = false, onSelect }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button key={i} type={interactive ? 'button' : undefined}
          onClick={() => interactive && onSelect?.(i)}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          disabled={!interactive}>
          <Star size={size}
            className={`transition ${
              i <= (interactive ? hovered || rating : rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-200 fill-gray-200'
            }`} />
        </button>
      ))}
    </div>
  )
}

function RatingBar({ reviews }) {
  const counts = [5,4,3,2,1].map(r => ({
    rating: r,
    count: reviews.filter(rv => rv.rating === r).length
  }))
  const max = Math.max(...counts.map(c => c.count), 1)
  return (
    <div className="space-y-1.5">
      {counts.map(({ rating, count }) => (
        <div key={rating} className="flex items-center gap-2 text-xs">
          <span className="w-3 text-gray-500 font-medium">{rating}</span>
          <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(count / max) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.1 * (5 - rating) }}
              className="h-full bg-amber-400 rounded-full"
            />
          </div>
          <span className="w-4 text-gray-400 text-right">{count}</span>
        </div>
      ))}
    </div>
  )
}

// ── Formulaire avis (clients connectés seulement) ─────────────
function ReviewForm({ productId, client, onSuccess }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [images, setImages]   = useState([])
  const [open, setOpen]       = useState(false)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!rating)          throw new Error('Choisissez une note')
      if (!comment.trim())  throw new Error('Écrivez un commentaire')

      const fd = new FormData()
      fd.append('author_name', `${client.first_name} ${client.last_name}`.trim())
      fd.append('author_phone', client.phone || '')
      fd.append('rating', rating)
      fd.append('comment', comment)
      images.forEach(img => fd.append('images', img.file))

      const { data } = await api.post(`/reviews/product/${productId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return data
    },
    onSuccess: () => {
      toast.success('Merci ! Votre avis sera publié après vérification.')
      setRating(0); setComment(''); setImages([]); setOpen(false)
      onSuccess?.()
    },
    onError: (err) => toast.error(err.message || 'Erreur')
  })

  const addImage = (e) => {
    const files = Array.from(e.target.files || [])
    setImages(prev => [...prev, ...files.slice(0, 3 - prev.length).map(f => ({
      file: f, preview: URL.createObjectURL(f)
    }))])
  }

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left">
        <span className="font-bold text-gray-700 text-sm">✍️ Laisser un avis</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="p-4 space-y-3">
              {/* Info client connecté */}
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-xl text-xs text-green-700">
                <CheckCircle size={13} />
                Vous postez en tant que <strong>{client.first_name} {client.last_name}</strong>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">Votre note *</p>
                <Stars rating={rating} size={28} interactive onSelect={setRating} />
              </div>

              <textarea placeholder="Votre avis sur le produit... *" rows={3}
                value={comment} onChange={e => setComment(e.target.value)}
                className="input-field text-sm w-full resize-none" />

              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">Photos (optionnel, max 3)</p>
                <div className="flex gap-2 flex-wrap">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      <button type="button"
                        onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-primary-400 transition">
                      <Camera size={18} className="text-gray-300" />
                      <input type="file" accept="image/*" multiple onChange={addImage} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
                {mutation.isPending
                  ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  : <Send size={15} />}
                Envoyer mon avis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Bloc pour visiteurs non connectés ─────────────────────────
function LoginPrompt() {
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
      <Lock size={18} className="text-gray-400 shrink-0" />
      <p className="text-sm text-gray-500 flex-1">
        <Link to="/connexion" className="text-primary-600 font-semibold hover:underline">Connectez-vous</Link>
        {' '}ou{' '}
        <Link to="/inscription" className="text-primary-600 font-semibold hover:underline">créez un compte</Link>
        {' '}pour laisser un avis.
      </p>
    </div>
  )
}

// ── Carte avis (sans date) ────────────────────────────────────
function ReviewCard({ review }) {
  const [showImages, setShowImages] = useState(false)
  const images = Array.isArray(review.images) ? review.images : []

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 border border-gray-100 rounded-2xl space-y-2 bg-white">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-primary-700 font-black text-xs">
              {review.author_name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold text-gray-800 text-sm">{review.author_name}</p>
            {review.is_verified && (
              <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium">
                <CheckCircle size={11} /> Achat vérifié
              </span>
            )}
          </div>
        </div>
        <Stars rating={review.rating} size={14} />
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>

      {images.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowImages(s => !s)}
            className="text-xs text-primary-600 font-medium flex items-center gap-1">
            <Camera size={12} />
            {images.length} photo{images.length > 1 ? 's' : ''}
            {showImages ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <AnimatePresence>
            {showImages && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden mt-2">
                <div className="flex gap-2 flex-wrap">
                  {images.map((img, i) => (
                    <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
                      <img src={img.url} alt="" className="w-20 h-20 object-cover rounded-xl border hover:opacity-90 transition" />
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

// ── Composant principal ───────────────────────────────────────
export default function ReviewsSection({ productId }) {
  const qc = useQueryClient()
  const { client, isAuthenticated } = useClientAuthStore()
  const [showAll, setShowAll] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => api.get(`/reviews/product/${productId}`).then(r => r.data),
    enabled: !!productId,
  })

  const reviews   = data?.reviews || []
  const avg       = data?.avg || 0
  const total     = data?.total || 0
  const displayed = showAll ? reviews : reviews.slice(0, 3)

  return (
    <div className="mt-10">
      <h2 className="text-xl font-black text-gray-800 mb-5">
        Avis clients
        {total > 0 && <span className="ml-2 text-base font-normal text-gray-400">({total})</span>}
      </h2>

      {total > 0 && (
        <div className="flex gap-6 items-center p-4 bg-amber-50 border border-amber-100 rounded-2xl mb-6">
          <div className="text-center shrink-0">
            <p className="text-4xl font-black text-amber-500">{avg}</p>
            <Stars rating={Math.round(avg)} size={16} />
            <p className="text-xs text-gray-400 mt-1">{total} avis</p>
          </div>
          <div className="flex-1"><RatingBar reviews={reviews} /></div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-400 text-sm py-6 text-center">
          Aucun avis pour l'instant — soyez le premier ! 👇
        </p>
      ) : (
        <div className="space-y-3 mb-4">
          <AnimatePresence>
            {displayed.map(r => <ReviewCard key={r.id} review={r} />)}
          </AnimatePresence>
          {reviews.length > 3 && (
            <button onClick={() => setShowAll(s => !s)}
              className="w-full py-2 text-sm text-primary-600 font-semibold hover:underline flex items-center justify-center gap-1">
              {showAll
                ? <><ChevronUp size={15}/> Voir moins</>
                : <><ChevronDown size={15}/> Voir les {reviews.length - 3} autres avis</>}
            </button>
          )}
        </div>
      )}

      {/* Formulaire — connecté seulement */}
      {isAuthenticated
        ? <ReviewForm productId={productId} client={client} onSuccess={() => qc.invalidateQueries({ queryKey: ['reviews', productId] })} />
        : <LoginPrompt />
      }
    </div>
  )
}
