import { validString } from './common'
import { z } from 'zod'

export const loginSchema = z.object({
  username: validString('Username', { min: 4, max: 20 }),
  password: validString('Mot de passe', { min: 3 }),
})

export const changePasswordSchema = z.object({
  newPassword: validString('Mot de passe', { min: 6 }),
})
