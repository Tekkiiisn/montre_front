import { Link } from 'react-router-dom'
import logo from '@/assets/logo.png'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Contenu principal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8 border-b border-gray-800">

          {/* Colonne 1 — Marque */}
          <div className="flex flex-col items-center sm:items-start gap-3">
            <img src={logo} alt="SenMontre" className="h-10 w-auto brightness-200" />
            <p className="text-xs text-gray-500 text-center sm:text-left leading-relaxed">
              Montres de qualité livrées partout au Sénégal. Style, élégance et fiabilité pour toute la famille.
            </p>
          </div>

         

          {/* Colonne 3 — Paiements & Contact */}
          <div className="flex flex-col items-center sm:items-end gap-3">
            <p className="text-white font-semibold text-sm">Moyens de paiement</p>
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
              <span className="bg-gray-800 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white">🌊 Wave</span>
              <span className="bg-gray-800 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white">🟠 Orange Money</span>
              <span className="bg-gray-800 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white">💵 À la livraison</span>
            </div>
            <p className="text-xs text-gray-500">🚚 Livraison partout au Sénégal</p>
            <p className="text-xs text-gray-500">📦 Traitement sous 24h</p>
          </div>
        </div>

        {/* Bas de page */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>© {new Date().getFullYear()} <span className="text-gray-400 font-semibold">SenMontre</span> — Tous droits réservés</span>
          
        </div>

      </div>
    </footer>
  )
}
