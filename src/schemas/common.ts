import z from 'zod'

export const positiveNumber = (
  field: string,
  option?: { min?: number; max?: number },
) => {
  let schema = z.coerce
    .number(`${field} doit être un nombre valide`)
    .positive(`${field} doit être positif`)

  if (option?.min) {
    schema = schema.min(
      option?.min,
      `${field} doit être au moins ${option.min}`,
    )
  }

  if (option?.max) {
    schema = schema.max(
      option?.max,
      `${field} doit être au maximum ${option.max}`,
    )
  }
  return schema
}

export const validString = (
  field: string,
  option?: {
    min?: number
    max?: number
    exactC?: number
    email?: boolean
  },
) => {
  let schema = z
    .string(`${field} doit être une chaîne de caractères valide`)
    .trim()

  if (option?.min) {
    schema = schema.min(
      option.min,
      `${field} doit contenir au moins ${option.min} caractères`,
    )
  }

  if (option?.max) {
    schema = schema.max(
      option.max,
      `${field} doit contenir maximum ${option.max} caractères`,
    )
  }

  if (option?.exactC) {
    schema = schema.length(
      option.exactC,
      `${field} doit faire exactement ${option.exactC} caractères`,
    )
  }

  if (option?.email) {
    schema = schema.toLowerCase().email(`${field} doit être un email valide`)
  }
  return schema
}

export const idSchema = z.object({
  id: positiveNumber('Id'),
})

export const validDate = (field: string) => {
 return z.coerce.date(`${field} doit être une date valide`)
}
