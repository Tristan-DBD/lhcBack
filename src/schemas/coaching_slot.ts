import { z } from 'zod'
import { positiveNumber, validDate, validString, idSchema } from './common'

const baseCoachingSlotSchema = z.object({
  id: z.string().uuid("L'id"),
  coachId: z.string().uuid("l'id du coach"),
  startTime: validDate('La date de début'),
  endTime: validDate('La date de fin'),
})

export const slotBookingSchema = z.object({
  slotId: z.string().uuid("l'id du créneau"),
  userId: z.string().uuid("l'id de l'utilisateur"),
})

export const coachingSlotQuerySchema = z.object({
  page: z.preprocess((val) => Number(val), z.number().int().min(1)).default(1),
  limit: z
    .preprocess((val) => Number(val), z.number().int().min(1).max(1000))
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
  coachId: z.string().uuid("l'id du coach").optional(),
})

export const createCoachingSlotSchema = baseCoachingSlotSchema.omit({ id: true }).refine(
  (data) => data.endTime > data.startTime,
  {
    message: 'La date de fin doit être après la date de début',
    path: ['endTime'],
  },
)

export const batchCoachingSlotSchema = z.object({
  coachId: z.string().uuid("l'id du coach"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  startDate: validDate('La date de début'),
  endDate: validDate('La date de fin'),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  {
    message: 'La date de fin doit être après ou égale à la date de début',
    path: ['endDate'],
  },
).refine(
  (data) => {
    const [sh, sm] = data.startTime.split(':').map(Number)
    const [eh, em] = data.endTime.split(':').map(Number)
    return (eh! * 60 + em!) > (sh! * 60 + sm!)
  },
  {
    message: 'L\'heure de fin doit être après l\'heure de début',
    path: ['endTime'],
  },
)

export const partialCoachingSlotSchema = baseCoachingSlotSchema
  .omit({ id: true })
  .partial()
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La date de fin doit être après la date de début',
        path: ['endTime'],
      })
    }
  })
