import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productService } from '@/services/productService.js'
import ProductGrid from '@/components/product/ProductGrid.jsx'
import ProductFilters from '@/components/product/ProductFilters.jsx'
import HeroBanner from '@/components/layout/HeroBanner.jsx'
import { Helmet } from 'react-helmet-async'

const DEFAULT_FILTERS = {
  q:           '',
  category_id: '',
  min_price:   '',
  max_price:   '',
  sort:        'newest',
}

export default function HomePage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getAll(filters),
    keepPreviousData: true,
  })

  const products = data?.products || []

  return (
    <>
      <Helmet>
        <title>Ma Boutique — Livraison partout au Sénégal</title>
        <meta name="description" content="Boutique en ligne avec livraison partout au Sénégal. Paiement Wave, Orange Money ou à la livraison." />
      </Helmet>

      <HeroBanner />

      <div id="produits" className="max-w-7xl mx-auto px-4 py-8">
        <ProductFilters filters={filters} onChange={setFilters} />
        <ProductGrid products={products} isLoading={isLoading} />
      </div>
    </>
  )
}