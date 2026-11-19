import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/validators/authValidator.js'
import { authService } from '@/services/authService.js'
import { useAuthStore } from '@/store/authStore.js'
import { useNavigate } from 'react-router-dom'
import Input from '@/components/common/Input.jsx'
import Button from '@/components/common/Button.jsx'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { Helmet } from 'react-helmet-async'

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) })
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const { token, user } = await authService.login(data.email, data.password)
      login(token, user)
      navigate('/admin')
    } catch {
      toast.error('Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet><title>Connexion Admin — Ma Boutique</title></Helmet>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="card p-8 w-full max-w-sm">
          <h1 className="text-2xl font-black text-center text-gray-800 mb-8">🔐 Admin</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} autoFocus />
            <Input label="Mot de passe" type="password" {...register('password')} error={errors.password?.message} />
            <Button type="submit" loading={loading} className="w-full py-3 mt-2">Connexion</Button>
          </form>
        </div>
      </div>
    </>
  )
}