import { z } from 'zod'
import { validString } from './common'

export const createProductSchema = z.object({
  name: validString('Le nom du produit', { min: 2, max: 100 }),
  price: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0, 'Le prix doit être positif'),
  ),
  sizes: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val)
        } catch (e) {
          return val
        }
      }
      return val
    },
    z.array(z.string()).min(1, 'Veuillez sélectionner au moins une taille'),
  ),
})

export type CreateProductInput = z.infer<typeof createProductSchema>

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'], {
    message: 'Statut de commande invalide',
  }),
})
