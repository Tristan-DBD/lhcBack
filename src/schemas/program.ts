import { positiveNumber, validString } from './common'
import { z } from 'zod'

export const deleteProgramSchema = z.object({
  id: positiveNumber('l\'id du programme'),
  name: validString('le nom du programme'),
})
