import z from 'zod'

const positiveNumber = (field: string) =>
  z.coerce
    .number(`${field} doit est un nombre valide`)
    .positive(`${field} doit être positif`)

const validString = (
  field: string,
  option?: {
    min?: number
    max?: number
    exactC?: number
    email?: boolean
  },
) => {
  let schema = z.string(`${field} doit être une chaîne de caractère valide`)

  if (option?.min) {
    schema = schema.min(
      option.min,
      `${field} doit contenir au moins ${option.min} caractère`,
    )
  }

  if (option?.max) {
    schema = schema.max(
      option.max,
      `${field} doit contenir maximum ${option.max} caractère`,
    )
  }

  if (option?.exactC) {
    schema = schema.length(
      option.exactC,
      `${field} doit faire exactement ${option.exactC} caractère`,
    )
  }

  if (option?.email) {
    schema = schema.email(`${field} doit être un email valide`)
  }
  return schema
}

const roleEnum = z.enum(['COACH', 'ATHLETE_CO', 'ATHLETE_PROG'])

export const idSchema = z.object({
  id: positiveNumber('Id'),
})

const userSchema = z.object({
  id: positiveNumber('Id'),
  name: validString('Name', { min: 4, max: 10 }),
  surname: validString('Surname', { min: 4, max: 20 }),
  age: positiveNumber('Age'),
  weight: positiveNumber('Weight'),
  phone: validString('Phone', { exactC: 10 }),
  email: validString('Email', { email: true }),
  password: validString('Password', { min: 3 }),
  role: roleEnum,
})

export const createUserSchema = userSchema.omit({ id: true })
export const partialUserSchema = userSchema.partial()
