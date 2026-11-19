import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productService } from '@/services/productService.js'
import api from '@/services/api.js'
import Input from '@/components/common/Input.jsx'
import Button from '@/components/common/Button.jsx'
import { toast } from 'react-toastify'
import { useState } from 'react'
import { ArrowLeft, ImagePlus, Video, X, Star, Plus } from 'lucide-react'

const schema = z.object({
  name:             z.string().min(3).max(200),
  price:            z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, { message: 'Prix invalide' }),
  compare_price:    z.string().optional(),
  stock:            z.string().refine(v => /^\d+$/.test(v), { message: 'Stock invalide' }),
  category_id:      z.string().optional(),
  description:      z.string().max(2000).optional(),
  badge:            z.enum(['nouveau', 'promo', 'rupture', '']).optional(),
  is_active:        z.boolean().optional(),
  is_featured:      z.boolean().optional(),
  meta_title:       z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
})

const EMPTY_REVIEW = { author_name: '', rating: 5, comment: '', created_at: '' }

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}>
          <Star size={20}
            className={`transition ${i <= (hovered || value)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-200 fill-gray-200'}`} />
        </button>
      ))}
    </div>
  )
}

export default function AdminProductNew() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [images, setImages]                 = useState([])
  const [video, setVideo]                   = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoProgress, setVideoProgress]   = useState(0)

  // ── Faux avis ───────────────────────────────────────────────
  const [fakeReviews, setFakeReviews] = useState([])
  const [newReview, setNewReview]     = useState({ ...EMPTY_REVIEW })
  const [reviewImages, setReviewImages] = useState([]) // { file, preview }

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data)
  })

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true, is_featured: false, badge: '' }
  })

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Créer le produit
      const product = await productService.create({
        ...data,
        price:             parseFloat(data.price),
        compare_price:     data.compare_price ? parseFloat(data.compare_price) : null,
        stock:             parseInt(data.stock),
        imagekit_images: images,
imagekit_video:  video,
        og_image_url:      images[0]?.url || null,
      })

      // 2. Envoyer les faux avis si présents
      const productId = product?.id || product?.data?.id || product?.product?.id
      if (productId && fakeReviews.length > 0) {
        for (const r of fakeReviews) {
          const fd = new FormData()
          fd.append('product_id',  productId)
          fd.append('author_name', r.author_name)
          fd.append('rating',      r.rating)
          fd.append('comment',     r.comment)
          if (r.created_at) fd.append('created_at', new Date(r.created_at).toISOString())
          if (r.imageFiles) r.imageFiles.forEach(f => fd.append('images', f))
          await api.post('/reviews/admin/fake', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }
      }

      return product
    },
    onSuccess: () => {
      qc.invalidateQueries(['admin-products'])
      toast.success(`Produit créé${fakeReviews.length > 0 ? ` avec ${fakeReviews.length} avis !` : ' !'}`)
      navigate('/admin/produits')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  })

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setImages(prev => [...prev, { url: data.url, public_id: data.public_id }])
      toast.success('Image ajoutée')
    } catch { toast.error("Erreur upload image") }
    finally { setUploadingImage(false); e.target.value = '' }
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { toast.error('Vidéo trop lourde (max 50MB)'); return }
    setUploadingVideo(true); setVideoProgress(0)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
        onUploadProgress: (e) => setVideoProgress(Math.round((e.loaded / e.total) * 100))
      })
      setVideo({ url: data.url, public_id: data.public_id })
      toast.success('Vidéo ajoutée ✅')
    } catch { toast.error("Erreur upload vidéo") }
    finally { setUploadingVideo(false); setVideoProgress(0); e.target.value = '' }
  }

  // ── Handlers faux avis ───────────────────────────────────────
  const addReviewImage = (e) => {
    const files = Array.from(e.target.files || [])
    setReviewImages(prev => [
      ...prev,
      ...files.slice(0, 3 - prev.length).map(f => ({ file: f, preview: URL.createObjectURL(f) }))
    ])
    e.target.value = ''
  }

  const addFakeReview = () => {
    if (!newReview.author_name.trim()) { toast.error('Prénom requis'); return }
    if (!newReview.comment.trim())     { toast.error('Commentaire requis'); return }
    setFakeReviews(prev => [...prev, {
      ...newReview,
      id:         Date.now(),
      imageFiles: reviewImages.map(i => i.file),
      imagePreviews: reviewImages.map(i => i.preview),
    }])
    setNewReview({ ...EMPTY_REVIEW })
    setReviewImages([])
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/produits')} className="p-2 hover:bg-gray-100 rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-gray-800">Nouveau produit</h1>
      </div>

      <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">

        {/* Infos générales */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-700 border-b pb-2">Informations générales</h2>
          <Input label="Nom *" {...register('name')} error={errors.name?.message} autoFocus />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prix (FCFA) *" type="number" {...register('price')} error={errors.price?.message} />
            <Input label="Prix barré" type="number" {...register('compare_price')} />
          </div>
          <Input label="Stock *" type="number" {...register('stock')} error={errors.stock?.message} />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Catégorie</label>
            <select {...register('category_id')} className="input-field">
              <option value="">Sélectionner...</option>
              {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <textarea {...register('description')} rows={4} className="input-field resize-none" />
          </div>
        </div>

        {/* Médias */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-700 border-b pb-2">Photos & Vidéo</h2>
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
              <ImagePlus size={15} /> Photos
            </p>
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={img.url} alt="" className="w-full h-full object-cover rounded-xl border" />
                    <button type="button" onClick={() => setImages(p => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                      <X size={11} />
                    </button>
                    {i === 0 && <span className="absolute bottom-1 left-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">Principale</span>}
                  </div>
                ))}
              </div>
            )}
            <label className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer transition text-sm
              ${uploadingImage ? 'border-primary-300 bg-primary-50 cursor-wait' : 'border-gray-200 hover:border-primary-400'}`}>
              <ImagePlus size={18} className="text-gray-400" />
              <span className="text-gray-500">{uploadingImage ? 'Upload...' : 'Ajouter une photo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
              <Video size={15} /> Vidéo <span className="text-xs text-gray-400 font-normal">(optionnel — max 50MB)</span>
            </p>
            {video?.url ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video src={video.url} controls className="w-full h-full object-contain" />
                <button type="button" onClick={() => setVideo(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-xl cursor-pointer transition
                ${uploadingVideo ? 'border-blue-300 bg-blue-50 cursor-wait' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                <Video size={28} className="text-gray-400" />
                {uploadingVideo ? (
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Upload en cours...</span><span>{videoProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-gray-500 font-medium">Ajouter une vidéo</span>
                    <span className="text-xs text-gray-400">MP4, MOV, WebM — max 50MB</span>
                  </>
                )}
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={uploadingVideo} />
              </label>
            )}
          </div>
        </div>

        {/* ── Avis fictifs ─────────────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-bold text-gray-700">⭐ Avis fictifs</h2>
            <span className="text-xs text-gray-400">optionnel — publiés directement</span>
          </div>

          {/* Avis déjà ajoutés */}
          {fakeReviews.length > 0 && (
            <div className="space-y-2">
              {fakeReviews.map((r, i) => (
                <div key={r.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-gray-800">{r.author_name}</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={11}
                            className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                      {r.created_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{r.comment}</p>
                    {r.imagePreviews?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {r.imagePreviews.map((src, j) => (
                          <img key={j} src={src} alt="" className="w-10 h-10 object-cover rounded-lg border" />
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="button"
                    onClick={() => setFakeReviews(prev => prev.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 transition shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire nouvel avis */}
          <div className="space-y-3 border border-dashed border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ajouter un avis</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                placeholder="Prénom du client *"
                value={newReview.author_name}
                onChange={e => setNewReview(r => ({ ...r, author_name: e.target.value }))}
                className="input-field text-sm"
              />
              <div>
                <p className="text-xs text-gray-400 mb-1">Note</p>
                <StarPicker
                  value={newReview.rating}
                  onChange={v => setNewReview(r => ({ ...r, rating: v }))}
                />
              </div>
            </div>

            <textarea
              placeholder="Commentaire du client *"
              rows={2}
              value={newReview.comment}
              onChange={e => setNewReview(r => ({ ...r, comment: e.target.value }))}
              className="input-field text-sm w-full resize-none"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <p className="text-xs text-gray-400 mb-1">Date simulée (optionnel)</p>
                <input
                  type="datetime-local"
                  value={newReview.created_at}
                  onChange={e => setNewReview(r => ({ ...r, created_at: e.target.value }))}
                  className="input-field text-sm w-full"
                />
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Photos preuves (max 3)</p>
                <div className="flex gap-2 flex-wrap">
                  {reviewImages.map((img, i) => (
                    <div key={i} className="relative w-12 h-12 rounded-xl overflow-hidden border">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      <button type="button"
                        onClick={() => setReviewImages(imgs => imgs.filter((_, j) => j !== i))}
                        className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X size={8} />
                      </button>
                    </div>
                  ))}
                  {reviewImages.length < 3 && (
                    <label className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-primary-400 transition">
                      <ImagePlus size={14} className="text-gray-300" />
                      <input type="file" accept="image/*" multiple onChange={addReviewImage} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <button type="button" onClick={addFakeReview}
              className="btn-secondary w-full py-2.5 text-sm flex items-center justify-center gap-2">
              <Plus size={15} /> Ajouter cet avis à la liste
            </button>
          </div>

          {fakeReviews.length > 0 && (
            <p className="text-xs text-green-600 font-medium">
              ✅ {fakeReviews.length} avis seront publiés à la création du produit
            </p>
          )}
        </div>

        {/* Options */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-700 border-b pb-2">Options</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Badge</label>
            <select {...register('badge')} className="input-field">
              <option value="">Aucun</option>
              <option value="nouveau">🟢 Nouveau</option>
              <option value="promo">🔴 Promo</option>
              <option value="rupture">⚫ Rupture</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-primary-600" />
            <span className="text-sm font-medium text-gray-700">Produit actif</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('is_featured')} className="w-4 h-4 accent-primary-600" />
            <span className="text-sm font-medium text-gray-700">Mettre en avant</span>
          </label>
        </div>

        {/* SEO */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-700 border-b pb-2">SEO & Facebook Ads</h2>
          <Input label="Meta titre (max 60 car.)" {...register('meta_title')} />
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Meta description</label>
            <textarea {...register('meta_description')} rows={2} className="input-field resize-none" />
          </div>
        </div>

        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate('/admin/produits')} className="btn-secondary flex-1 py-3">
            Annuler
          </button>
          <Button type="submit" loading={createMutation.isPending} className="flex-1 py-3">
            ✨ Créer le produit
          </Button>
        </div>

      </form>
    </div>
  )
}
