import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '@/services/productService.js'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Package, Tag, Eye } from 'lucide-react'
import { toast } from 'react-toastify'
import Spinner from '@/components/common/Spinner.jsx'
import EmptyState from '@/components/common/EmptyState.jsx'
import Badge from '@/components/common/Badge.jsx'

export default function AdminProducts() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productService.getAll({ admin: true })
  })

  const deleteMutation = useMutation({
    mutationFn: productService.remove,
    onSuccess: () => { qc.invalidateQueries(['admin-products']); toast.success('Produit supprimé') },
    onError: () => toast.error('Erreur lors de la suppression')
  })

  const products = data?.products || []
  if (isLoading) return <Spinner className="py-20" />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-black text-gray-800">
          Produits
          {products.length > 0 && <span className="ml-2 text-base font-normal text-gray-400">({products.length})</span>}
        </h1>
        <Link to="/admin/produits/nouveau" className="btn-primary flex items-center gap-2 py-2 px-3 sm:px-4 text-sm">
          <Plus size={18} />
          <span className="hidden sm:inline">Nouveau produit</span>
          <span className="sm:hidden">Nouveau</span>
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyState icon="📦" title="Aucun produit" description="Ajoutez votre premier produit."
          action={<Link to="/admin/produits/nouveau" className="btn-primary">Ajouter un produit</Link>} />
      ) : (
        <>
          {/* Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:hidden">
            {products.map(p => {
              const image = p.cloudinary_images?.[0]?.url
              return (
                <div key={p.id} className="card p-4 flex gap-3">
                  <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    {image ? <img src={image} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package size={28} className="text-gray-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1 mb-1">
                      <p className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 flex-1">{p.name}</p>
                      {p.badge && <Badge type={p.badge} />}
                    </div>
                    {p.categories && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                        <Tag size={11} /> {p.categories.name}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-black text-primary-700 text-sm">{Number(p.price).toLocaleString()} FCFA</span>
                      {p.compare_price && <span className="text-xs text-gray-300 line-through">{Number(p.compare_price).toLocaleString()}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                          ${p.stock === 0 ? 'bg-red-100 text-red-500' : p.stock <= 5 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                          Stock: {p.stock}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${p.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {p.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {/* ✅ Voir → page admin prévisualisation */}
                        <Link to={`/admin/produits/${p.id}/voir`}
                          className="p-1.5 hover:bg-green-50 text-green-500 rounded-lg transition" title="Prévisualiser">
                          <Eye size={15} />
                        </Link>
                        <Link to={`/admin/produits/${p.id}/edit`}
                          className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition" title="Modifier">
                          <Edit size={15} />
                        </Link>
                        <button onClick={() => window.confirm('Supprimer ?') && deleteMutation.mutate(p.id)}
                          className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition" title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop */}
          <div className="card overflow-hidden hidden xl:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold w-16">Image</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Nom</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Catégorie</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Prix</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Stock</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Statut</th>
                    <th className="px-4 py-3 text-left text-gray-500 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                          {p.cloudinary_images?.[0]?.url
                            ? <img src={p.cloudinary_images[0].url} alt={p.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-gray-300" /></div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                        {p.badge && <Badge type={p.badge} />}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.categories?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-primary-700">{Number(p.price).toLocaleString()} FCFA</p>
                        {p.compare_price && <p className="text-xs text-gray-300 line-through">{Number(p.compare_price).toLocaleString()}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm
                          ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-yellow-500' : 'text-green-600'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full
                          ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {/* ✅ Voir → page admin prévisualisation */}
                          <Link to={`/admin/produits/${p.id}/voir`}
                            className="p-2 hover:bg-green-50 text-green-500 rounded-lg transition" title="Prévisualiser">
                            <Eye size={16} />
                          </Link>
                          <Link to={`/admin/produits/${p.id}/edit`}
                            className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition" title="Modifier">
                            <Edit size={16} />
                          </Link>
                          <button onClick={() => window.confirm('Supprimer ce produit ?') && deleteMutation.mutate(p.id)}
                            className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition" title="Supprimer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}