import { Routes, Route } from 'react-router-dom'
import PublicLayout from '@/layouts/PublicLayout.jsx'
import AdminLayout from '@/layouts/AdminLayout.jsx'
import ProtectedRoute from '@/components/common/ProtectedRoute.jsx'
import ClientProtectedRoute from '@/components/common/ClientProtectedRoute.jsx'

import HomePage           from '@/pages/HomePage.jsx'
import ProductDetailPage  from '@/pages/ProductDetailPage.jsx'
import CartPage           from '@/pages/CartPage.jsx'
import CheckoutPage       from '@/pages/CheckoutPage.jsx'
import OrderSuccessPage   from '@/pages/OrderSuccessPage.jsx'

import ClientRegisterPage from '@/pages/ClientRegisterPage.jsx'
import ClientLoginPage    from '@/pages/ClientLoginPage.jsx'
import ClientOrdersPage   from '@/pages/ClientOrdersPage.jsx'

import LoginPage              from '@/pages/LoginPage.jsx'
import AdminDashboard         from '@/pages/AdminDashboard.jsx'
import AdminProducts          from '@/pages/AdminProducts.jsx'
import AdminProductNew        from '@/pages/AdminProductNew.jsx'
import AdminProductEdit       from '@/pages/AdminProductEdit.jsx'
import AdminProductPreview    from '@/pages/AdminProductPreview.jsx'
import AdminOrders            from '@/pages/AdminOrders.jsx'
import AdminOrderDetail       from '@/pages/AdminOrderDetail.jsx'
import AdminReviews from '@/pages/Adminreviews.jsx'
import NotFoundPage           from '@/pages/NotFoundPage.jsx'

export default function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="produit/:id"      element={<ProductDetailPage />} />
        <Route path="panier"           element={<CartPage />} />
        <Route path="commande"         element={<CheckoutPage />} />
        <Route path="commande/success" element={<OrderSuccessPage />} />
        <Route path="inscription"      element={<ClientRegisterPage />} />
        <Route path="connexion"        element={<ClientLoginPage />} />
        <Route element={<ClientProtectedRoute />}>
          <Route path="mes-commandes" element={<ClientOrdersPage />} />
        </Route>
      </Route>

      {/* Admin auth */}
      <Route path="admin/login" element={<LoginPage />} />

      {/* Routes admin protégées */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="admin"                           element={<AdminDashboard />} />
          <Route path="admin/produits"                  element={<AdminProducts />} />
          <Route path="admin/produits/nouveau"          element={<AdminProductNew />} />
          <Route path="admin/produits/:id/edit"         element={<AdminProductEdit />} />
          <Route path="admin/produits/:id/voir"         element={<AdminProductPreview />} />
          <Route path="admin/commandes"                 element={<AdminOrders />} />
          <Route path="admin/avis"                      element={<AdminReviews />} />
          <Route path="admin/commandes/:id"             element={<AdminOrderDetail />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
