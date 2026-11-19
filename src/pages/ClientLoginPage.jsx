import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { clientAuthService } from '@/services/clientAuthService.js'
import { useClientAuthStore } from '@/store/clientAuthStore.js'
import Input from '@/components/common/Input.jsx'
import Button from '@/components/common/Button.jsx'
import { Helmet } from 'react-helmet-async'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { LogIn } from 'lucide-react'

const schema = z.object({
  phone: z.string()
    .regex(/^(\+221)?(70|75|76|77|78)\d{7}$/, 'Numéro invalide (ex: 77 123 45 67)'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export default function ClientLoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })
  const login = useClientAuthStore(s => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)

  const from = location.state?.from || '/'

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const { token, client } = await clientAuthService.login(data)
      login(token, client)
      toast.success(`Bon retour ${client.first_name} ! 👋`)
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Téléphone ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet><title>Connexion — Ma Boutique</title></Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn size={28} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-800">Connexion</h1>
            <p className="text-gray-500 text-sm mt-1">Accédez à votre espace client</p>
          </div>

          <div className="card p-6 space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Téléphone" type="tel" placeholder="77 123 45 67"
                {...register('phone')} error={errors.phone?.message} autoFocus />
              <Input label="Mot de passe" type="password" placeholder="Votre mot de passe"
                {...register('password')} error={errors.password?.message} />
              <Button type="submit" loading={loading} className="w-full py-3">
                Se connecter
              </Button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">ou</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <Link to="/inscription" className="text-primary-600 font-semibold hover:underline">
                S'inscrire gratuitement
              </Link>
            </p>

            
          </div>
        </div>
      </div>
    </>
  )
}
