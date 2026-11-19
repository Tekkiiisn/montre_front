import { z } from 'zod'

// Regex : commence par une lettre, peut contenir lettres, chiffres, espaces et tirets
const nameRegex = /^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ0-9\s\-_']{2,}$/
const textOnlyRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/

export const productSchema = z.object({
  name: z.string()
    .min(3, 'Le nom doit faire au moins 3 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .regex(nameRegex, 'Le nom doit commencer par une lettre'),

  price: z.string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Le prix doit être un nombre positif'
    }),

  compare_price: z.string().optional()
    .refine(val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
      message: 'Le prix barré doit être un nombre positif'
    }),

  stock: z.string()
    .refine(val => /^\d+$/.test(val) && parseInt(val) >= 0, {
      message: 'Le stock doit être un nombre entier positif'
    }),

  category_id: z.string().uuid('Catégorie invalide'),

  description: z.string().max(2000, 'Description trop longue').optional(),

  badge: z.enum(['nouveau', 'promo', 'rupture', '']).optional(),

  is_featured: z.boolean().optional(),
})