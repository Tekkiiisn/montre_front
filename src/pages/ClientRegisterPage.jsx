import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { clientAuthService } from '@/services/clientAuthService.js'
import { useClientAuthStore } from '@/store/clientAuthStore.js'
import Input from '@/components/common/Input.jsx'
import Button from '@/components/common/Button.jsx'
import { Helmet } from 'react-helmet-async'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { UserPlus } from 'lucide-react'

const schema = z.object({
  first_name: z.string().min(2, 'Prénom trop court').max(100)
    .regex(/^[a-zA-ZÀ-ÿ\s'\-]+$/, 'Lettres uniquement'),
  last_name: z.string().min(2, 'Nom trop court').max(100)
    .regex(/^[a-zA-ZÀ-ÿ\s'\-]+$/, 'Lettres uniquement'),
  phone: z.string()
    .regex(/^(\+221)?(70|75|76|77|78)\d{7}$/, 'Numéro invalide (ex: 77 123 45 67)'),
  password: z.string().min(6, 'Mot de passe trop court (min 6 caractères)').max(100),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
})

export default function ClientRegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })
  const login = useClientAuthStore(s => s.login)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const { token, client } = await clientAuthService.register({
        first_name: data.first_name,
        last_name:  data.last_name,
        phone:      data.phone,
        password:   data.password,
      })
      login(token, client)
      toast.success(`Bienvenue ${client.first_name} ! 🎉`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet><title>Inscription — Ma Boutique</title></Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus size={28} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-800">Créer un compte</h1>
            <p className="text-gray-500 text-sm mt-1">
              Pour suivre vos commandes et payer en sécurité
            </p>
          </div>

          <div className="card p-6 space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prénom *" placeholder="Moussa"
                  {...register('first_name')} error={errors.first_name?.message} />
                <Input label="Nom *" placeholder="Diallo"
                  {...register('last_name')} error={errors.last_name?.message} />
              </div>
              <Input label="Téléphone *" type="tel" placeholder="77 123 45 67"
                {...register('phone')} error={errors.phone?.message} />
              <Input label="Mot de passe *" type="password" placeholder="Min 6 caractères"
                {...register('password')} error={errors.password?.message} />
              <Input label="Confirmer le mot de passe *" type="password" placeholder="Répéter le mot de passe"
                {...register('confirm_password')} error={errors.confirm_password?.message} />

              <Button type="submit" loading={loading} className="w-full py-3">
                Créer mon compte
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
              Déjà un compte ?{' '}
              <Link to="/connexion" className="text-primary-600 font-semibold hover:underline">
                Se connecter
              </Link>
            </p>

            <p className="text-center text-xs text-gray-400 border-t pt-3">
              <Link to="/commande" className="hover:text-primary-600 underline">
                Commander sans créer de compte →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
