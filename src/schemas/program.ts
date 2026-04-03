import { validString } from './common'
import { z } from 'zod'

export const deleteProgramSchema = z.object({
  id: z.string().uuid("l'id du programme"),
  name: validString('le nom du programme'),
})
