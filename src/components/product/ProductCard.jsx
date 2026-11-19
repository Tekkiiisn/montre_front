import { Link } from 'react-router-dom'
import Badge from '@/components/common/Badge.jsx'
import { motion } from 'framer-motion'

export default function ProductCard({ product }) {
  const isOutOfStock = product.stock === 0
  const mainImage = product.imagekit_images?.[0]?.url || 'https://via.placeholder.com/400x400?text=Image'

  const hasDiscount = product.compare_price && product.compare_price > product.price
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : 0

  return (
    <motion.div
      className="card group cursor-pointer overflow-hidden"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/produit/${product.id}`} className="block">
        <div className="relative overflow-hidden aspect-square">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.badge && <Badge type={product.badge} />}
          </div>
          {hasDiscount && !isOutOfStock && (
            <span className="absolute top-2 right-2 text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-full shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Épuisé</span>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>

          <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
            <span className="font-black text-primary-700 text-lg leading-none">
              {Number(product.price).toLocaleString()} FCFA
            </span>
            {hasDiscount && (
              <span className="text-gray-400 text-xs line-through leading-none">
                {Number(product.compare_price).toLocaleString()} FCFA
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
