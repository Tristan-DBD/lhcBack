import { z } from 'zod'
import { positiveNumber, validString } from './common'

const roleEnum = z.enum(['COACH', 'ATHLETE_CO', 'ATHLETE_PROG'])

const userSchema = z.object({
  id: positiveNumber('Id'),
  name: validString('Name', { min: 4, max: 10 }),
  surname: validString('Surname', { min: 4, max: 20 }),
  age: positiveNumber('Age', { min: 16, max: 100 }),
  weight: positiveNumber('Weight'),
  phone: validString('Phone', { exactC: 10 }),
  email: validString('Email', { email: true }),
  password: validString('Password', { min: 3 }),
  role: roleEnum,
})

export const createUserSchema = userSchema.omit({ id: true })
export const partialUserSchema = userSchema.partial()
