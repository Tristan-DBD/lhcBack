import { z } from 'zod'

const positiveNumber = (field: string) =>
  z
    .number({
      message: `${field} doit être un nombre valide`,
    })
    .positive(`${field} doit être positif`)

const positiveOptionalNumber = (field: string) =>
  positiveNumber(field).optional()

export const idSchema = z.object({
  id: positiveNumber('Id'),
})

export const statsSchema = z.object({
  userId: positiveNumber('UserId'),
  squat: positiveNumber('Squat'),
  bench: positiveNumber('Bench'),
  deadlift: positiveNumber('Deadlift'),
})

export const statsSchemaOptional = z.object({
  userId: positiveNumber('UserId'),
  squat: positiveOptionalNumber('Squat'),
  bench: positiveOptionalNumber('Bench'),
  deadlift: positiveOptionalNumber('Deadlift'),
})
