import { z } from 'zod'
import { positiveNumber, validDate, validString } from './common'

const courseSchema = z.object({
  id: z.string().uuid("L'id"),
  title: validString('Le titre', { min: 4, max: 100 }),
  maxParticipants: positiveNumber('Le nombre maximum de participant', {
    min: 1,
    max: 15,
  }),
  startAt: validDate('La date de début'),
  description: validString('La description', { max: 1000 }),
  coachId: z.string().uuid("l'id du coach"),
  durationMinutes: positiveNumber('Le temps de la séance', { min: 1 }),
})

export const registerSchema = z.object({
  userId: z.string().uuid("l'id de l'utilisateur"),
  courseId: z.string().uuid("l'id de la séance"),
})

export const courseQuerySchema = z.object({
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

export const createCourseSchema = courseSchema.omit({ id: true })
export const partialCourseSchema = courseSchema.partial()
