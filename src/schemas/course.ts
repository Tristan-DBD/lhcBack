import { z } from 'zod'
import { positiveNumber, validDate, validString } from './common'

const courseSchema = z.object({
  id: positiveNumber("L'id"),
  title: validString('Le titre', { min: 4, max: 100 }),
  maxParticipants: positiveNumber('Le nombre maximum de participant', {
    min: 1,
    max: 15,
  }),
  startAt: validDate('La date de début'),
  description: validString('La description', { max: 1000 }),
  coachId: positiveNumber("l'id du coach"),
  durationMinutes: positiveNumber('Le temps de la séance', { min: 1 }),
})

export const registerSchema = z.object({
  userId: positiveNumber("l'id de l'utilisateur"),
  courseId: positiveNumber("l'id de la séance"),
})

export const createCourseSchema = courseSchema.omit({ id: true })
export const partialCourseSchema = courseSchema.partial()
