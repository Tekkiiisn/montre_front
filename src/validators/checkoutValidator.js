import { z } from 'zod'

const phoneRegex = /^(\+221)?(70|75|76|77|78)\d{7}$/
const nameRegex = /^[a-zA-ZÀ-ÿ\s'\-]+$/

export const checkoutSchema = z.object({
  first_name: z.string()
    .min(2, 'Le prénom doit faire au moins 2 caractères')
    .max(100, 'Prénom trop long')
    .regex(nameRegex, 'Le prénom ne doit contenir que des lettres'),
  phone: z.string()
    .regex(phoneRegex, 'Numéro invalide (ex: 77 123 45 67)'),
  address: z.string()
    .min(10, 'Adresse trop courte (min 10 caractères)')
    .max(300, 'Adresse trop longue'),
  payment_method: z.enum(['livraison', 'wave', 'orange_money'], {
    required_error: 'Choisissez un mode de paiement'
  }),
})
