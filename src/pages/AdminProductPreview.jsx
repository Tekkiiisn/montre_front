import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productService } from '@/services/productService.js'
import Spinner from '@/components/common/Spinner.jsx'
import { ArrowLeft, Edit, Play, ShoppingCart, Plus, Minus } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminProductPreview() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [activeMedia, setActive]  = useState(0)
  const [mediaType, setMediaType] = useState('image')

  const { data, isLoading } = useQuery({
    queryKey: ['product-preview', id],
    queryFn:  () => productService.getById(id),
  })

  if (isLoading) return <Spinner className="py-20" />
  if (!data)     return <p className="text-center py-20 text-gray-400">Produit introuvable</p>

  const product = data
  const images  = Array.isArray(product.cloudinary_images) ? product.imagekit_images : []
  let video = product.imagitkit_video
  if (typeof video === 'string') { try { video = JSON.parse(video) } catch { video = null } }
  const hasVideo = !!(video?.url)

  return (
    <div className="max-w-5xl">
      {/* Barre admin */}
      <div className="flex items-center justify-between mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/produits')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition text-sm font-medium">
            <ArrowLeft size={16} /> Retour aux produits
          </button>
          <span className="text-yellow-600 text-xs font-semibold px-2 py-1 bg-yellow-100 rounded-full">
            👁 Prévisualisation admin
          </span>
        </div>
        <button
          onClick={() => navigate(`/admin/produits/${id}/edit`)}
          className="flex items-center gap-2 btn-primary py-2 px-4 text-sm">
          <Edit size={15} /> Modifier
        </button>
      </div>

      {/* Contenu produit — même layout que la page client */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Médias */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
            {mediaType === 'video' && hasVideo ? (
              <video src={video.url} controls autoPlay playsInline
                className="w-full h-full object-contain bg-black" />
            ) : images[activeMedia]?.url ? (
              <motion.img
                key={activeMedia}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                src={images[activeMedia].url} alt={product.name}
                className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart size={60} className="text-gray-200" />
              </div>
            )}
          </div>

          {(images.length > 1 || hasVideo) && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => { setActive(i); setMediaType('image') }}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition
                    ${mediaType === 'image' && activeMedia === i
                      ? 'border-primary-500 scale-105' : 'border-transparent hover:border-gray-300'}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {hasVideo && (
                <button onClick={() => setMediaType('video')}
                  className={`shrink-0 w-16 h-16 rounded-xl border-2 transition flex flex-col items-center justify-center gap-0.5
                    ${mediaType === 'video'
                      ? 'border-primary-500 bg-primary-50 scale-105'
                      : 'border-transparent bg-gray-100 hover:border-gray-300'}`}>
                  <Play size={18}
                    className={mediaType === 'video' ? 'text-primary-600' : 'text-gray-400'}
                    fill="currentColor" />
                  <span className="text-xs text-gray-400">Vidéo</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="flex flex-col">
          {product.badge && (
            <span className="inline-flex w-fit text-xs font-bold px-2.5 py-1 rounded-full mb-3 bg-primary-100 text-primary-700">
              {product.badge === 'nouveau' ? '🟢 Nouveau' : product.badge === 'promo' ? '🔴 Promo' : '⚫ Rupture'}
            </span>
          )}

          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2">{product.name}</h1>

          {product.categories && <p className="text-sm text-gray-400 mb-4">{product.categories.name}</p>}

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-black text-primary-700">
              {Number(product.price).toLocaleString()} FCFA
            </span>
            {product.compare_price && (
              <span className="text-lg text-gray-300 line-through">
                {Number(product.compare_price).toLocaleString()} FCFA
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6 whitespace-pre-line">
              {product.description}
            </p>
          )}

          <p className={`text-sm font-semibold mb-4
            ${product.stock === 0 ? 'text-red-500' : product.stock <= 5 ? 'text-yellow-600' : 'text-green-600'}`}>
            {product.stock === 0 ? '❌ Rupture de stock'
              : product.stock <= 5 ? `⚠️ Plus que ${product.stock} en stock`
              : `✅ En stock (${product.stock} disponibles)`}
          </p>

          {/* Bouton simulé — non fonctionnel en prévisualisation */}
          <div className="flex items-center gap-3 mb-5 opacity-50 pointer-events-none">
            <div className="w-10 h-10 rounded-xl border flex items-center justify-center"><Minus size={16} /></div>
            <span className="w-12 text-center text-xl font-black">1</span>
            <div className="w-10 h-10 rounded-xl border flex items-center justify-center"><Plus size={16} /></div>
          </div>

          <div className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 opacity-50 cursor-default">
            <ShoppingCart size={20} /> Ajouter au panier
          </div>

          <p className="text-xs text-center text-yellow-600 mt-3 font-medium">
            ℹ️ Mode prévisualisation — le panier est désactivé
          </p>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl space-y-2 text-xs text-gray-500">
            <p>🚚 Livraison partout au Sénégal</p>
            <p>💳 Paiement à la livraison disponible</p>
            <p>📦 Commande traitée sous 24h</p>
          </div>
        </div>
      </div>
    </div>
  )
}
