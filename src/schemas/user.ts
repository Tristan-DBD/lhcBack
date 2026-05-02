import { z } from 'zod'
import { positiveNumber, validString } from './common'

const userSchema = z.object({
  id: z.string().uuid('Id'),
  name: validString('Name', { min: 4, max: 10 }),
  surname: validString('Surname', { min: 4, max: 20 }),
  age: positiveNumber('Age', { min: 16, max: 100 }),
  weight: positiveNumber('Weight'),
  phone: validString('Phone', { exactC: 10 }),
})

export const createUserSchema = userSchema.omit({ id: true })
export const partialUserSchema = userSchema.partial()
