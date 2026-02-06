/* eslint-disable quotes */
import { validString } from './common'
import { z } from 'zod'

export const loginSchema = z.object({
  email: validString("l'email", { email: true }),
  password: validString('Mot de passe', { min: 3 }),
})
