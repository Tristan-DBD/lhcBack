import { z } from 'zod'
import { validDate, validString } from './common'

const individualSessionSchema = z.object({
  id: z.string().uuid("L'id"),
  title: validString('Le titre', { min: 4, max: 100 }),
  startAt: validDate('La date de début'),
  description: validString('La description', { max: 1000 }),
  coachId: z.string().uuid("l'id du coach"),
  durationMinutes: z.number().int().min(1, 'La durée doit être au moins 1 minute'),
})

export const registerSchema = z.object({
  userId: z.string().uuid("l'id de l'utilisateur"),
  courseId: z.string().uuid("l'id de la séance"),
})

export const sessionQuerySchema = z.object({
  page: z.preprocess((val) => Number(val), z.number().int().min(1)).default(1),
  limit: z
    .preprocess((val) => Number(val), z.number().int().min(1).max(100))
    .default(20),
  startDate: z
    .string()
    .datetime()
    .optional()
    .or(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    ),
  endDate: z
    .string()
    .datetime()
    .optional()
    .or(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    ),
})

export const createSessionSchema = individualSessionSchema.omit({ id: true })
export const partialSessionSchema = individualSessionSchema.omit({ id: true }).partial()
