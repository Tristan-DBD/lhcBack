import { z } from 'zod'
import { positiveNumber, validDate } from './common'

const baseCoachingSlotSchema = z.object({
  id: positiveNumber("L'id"),
  coachId: positiveNumber("l'id du coach"),
  startTime: validDate("L'heure de début"),
  endTime: validDate("L'heure de fin"),
})

export const slotBookingSchema = z.object({
  slotId: positiveNumber("l'id du créneau"),
  userId: positiveNumber("l'id de l'utilisateur"),
})

export const coachingSlotQuerySchema = z.object({
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
  coachId: z
    .preprocess((val) => Number(val), z.number().int().min(1))
    .optional(),
})

export const createCoachingSlotSchema = baseCoachingSlotSchema
  .omit({ id: true })
  .refine((data) => data.endTime > data.startTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ['endTime'],
  })
export const partialCoachingSlotSchema = baseCoachingSlotSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'heure de fin doit être après l'heure de début",
        path: ['endTime'],
      })
    }
  })
