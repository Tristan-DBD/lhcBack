import { z } from 'zod'
import { positiveNumber, validDate, validString } from './common'

const courseSchema = z.object({
  id: positiveNumber('Id'),
  title: validString('Le titre', { min: 4, max: 100 }),
  maxParticipants: positiveNumber('Le nombre maximum de participant', {
    min: 1,
    max: 15,
  }),
  startAt: validDate('La date de début'),
  description: validString('La description', { max: 1000 }),
  coachId: positiveNumber('CoachId'),
  durationMinutes: positiveNumber('Le temps de la séance', { min: 1 }),
})

export const createCourseSchema = courseSchema.omit({ id: true })
export const partialCourseSchema = courseSchema.partial()
