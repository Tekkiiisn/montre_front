import { Link } from 'react-router-dom'
export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl mb-6">404</div>
      <h1 className="text-2xl font-bold text-gray-700 mb-4">Page introuvable</h1>
      <Link to="/" className="btn-primary">Retour à l'accueil</Link>
    </div>
  )
}