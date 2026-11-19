import ProductCard from './ProductCard.jsx'
import Spinner from '@/components/common/Spinner.jsx'
import EmptyState from '@/components/common/EmptyState.jsx'

export default function ProductGrid({ products, isLoading }) {
  if (isLoading) return <Spinner size="lg" className="py-20" />
  if (!products?.length) {
    return <EmptyState icon="🔍" title="Aucun produit trouvé" description="Essayez de modifier vos filtres de recherche." />
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
