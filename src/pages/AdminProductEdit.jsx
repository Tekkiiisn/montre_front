import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { productService } from '@/services/productService.js'
import api from '@/services/api.js'
import Input from '@/components/common/Input.jsx'
import Button from '@/components/common/Button.jsx'
import Spinner from '@/components/common/Spinner.jsx'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'
import { ArrowLeft, Trash2, ImagePlus, Video, X } from 'lucide-react'

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

export default function AdminProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [images, setImages]           = useState([])
  const [video, setVideo]             = useState(null)   // { url, public_id }
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoProgress, setVideoProgress]   = useState(0)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data)
  })

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-edit', id],
    queryFn: () => productService.getById(id)
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (product) {
      reset({
        name:             product.name || '',
        price:            String(product.price || ''),
        compare_price:    product.compare_price ? String(product.compare_price) : '',
        stock:            String(product.stock ?? '0'),
        category_id:      product.category_id || '',
        description:      product.description || '',
        badge:            product.badge || '',
        is_active:        product.is_active ?? true,
        is_featured:      product.is_featured ?? false,
        meta_title:       product.meta_title || '',
        meta_description: product.meta_description || '',
      })
     // ✅ Après
setImages(product.imagekit_images || [])
setVideo(product.imagekit_video || null)
    }
  }, [product, reset])

  const updateMutation = useMutation({
    mutationFn: (data) => productService.update(id, {
      ...data,
      price:             parseFloat(data.price),
      compare_price:     data.compare_price ? parseFloat(data.compare_price) : null,
      stock:             parseInt(data.stock),
      imagekit_images: images,
imagekit_video:  video,
      og_image_url:      images[0]?.url || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['admin-products'])
      qc.invalidateQueries(['product-edit', id])
      toast.success('Produit mis à jour !')
      navigate('/admin/produits')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur')
  })

  // Upload image
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

  // Upload vidéo
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { toast.error('Vidéo trop lourde (max 50MB)'); return }
    setUploadingVideo(true)
    setVideoProgress(0)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
        onUploadProgress: (e) => {
          setVideoProgress(Math.round((e.loaded / e.total) * 100))
        }
      })
      setVideo({ url: data.url, public_id: data.public_id })
      toast.success('Vidéo ajoutée ✅')
    } catch { toast.error("Erreur upload vidéo") }
    finally { setUploadingVideo(false); setVideoProgress(0); e.target.value = '' }
  }

  if (isLoading) return <Spinner className="py-20" />

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/produits')}
          className="p-2 hover:bg-gray-100 rounded-xl transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-800">Modifier le produit</h1>
          <p className="text-sm text-gray-400 truncate">{product?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">

        {/* Infos générales */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-700 border-b pb-2">Informations générales</h2>
          <Input label="Nom *" {...register('name')} error={errors.name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prix (FCFA) *" type="number" {...register('price')} error={errors.price?.message} />
            <Input label="Prix barré" type="number" {...register('compare_price')} error={errors.compare_price?.message} />
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

        {/* Médias — Photos + Vidéo */}
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-gray-700 border-b pb-2">Photos & Vidéo</h2>

          {/* ── Photos ── */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
              <ImagePlus size={15} /> Photos du produit
            </p>

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={img.url} alt="" className="w-full h-full object-cover rounded-xl border" />
                    <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5
                        opacity-0 group-hover:opacity-100 transition">
                      <X size={11} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-primary-600 text-white
                        text-xs px-1.5 py-0.5 rounded-full">Principale</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <label className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed
              rounded-xl cursor-pointer transition text-sm
              ${uploadingImage ? 'border-primary-300 bg-primary-50 cursor-wait' : 'border-gray-200 hover:border-primary-400'}`}>
              <ImagePlus size={18} className="text-gray-400" />
              <span className="text-gray-500">{uploadingImage ? 'Upload...' : 'Ajouter une photo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
          </div>

          {/* ── Vidéo ── */}
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
              <Video size={15} /> Vidéo du produit <span className="text-xs text-gray-400 font-normal">(optionnel — max 50MB)</span>
            </p>

            {/* Prévisualisation vidéo existante */}
            {video?.url && (
              <div className="relative mb-3 rounded-xl overflow-hidden bg-black aspect-video">
                <video src={video.url} controls className="w-full h-full object-contain" />
                <button type="button" onClick={() => setVideo(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5
                    hover:bg-red-600 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Upload vidéo */}
            {!video?.url && (
              <label className={`flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed
                rounded-xl cursor-pointer transition
                ${uploadingVideo ? 'border-blue-300 bg-blue-50 cursor-wait' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                <Video size={28} className="text-gray-400" />
                {uploadingVideo ? (
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Upload en cours...</span>
                      <span>{videoProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${videoProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-gray-500 font-medium">Ajouter une vidéo</span>
                    <span className="text-xs text-gray-400">MP4, MOV, WebM — max 50MB</span>
                  </>
                )}
                <input type="file" accept="video/*" className="hidden"
                  onChange={handleVideoUpload} disabled={uploadingVideo} />
              </label>
            )}
          </div>
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
          <Button type="submit" loading={updateMutation.isPending} className="flex-1 py-3">
            💾 Enregistrer
          </Button>
        </div>
      </form>
    </div>
  )
}
