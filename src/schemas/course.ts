import { z } from 'zod'

const positiveNumber = (field: string) =>
  z.coerce
    .number(`${field} doit être un nombre`)
    .positive(`${field} doit être positif`)

const validString = (field: string) => {
  let schema = z.string(`${field} doit être une chaîne de caractère valide`)

  return schema
}

const validDate = (field: string) =>
  z.coerce.date(`${field} doit être une date valide`)

export const idSchema = z.object({
  // eslint-disable-next-line prettier/prettier
  id: positiveNumber('L\'id'),
})

const courseSchema = z.object({
  id: positiveNumber('Id'),
  title: validString('Le titre'),
  maxParticipants: positiveNumber('Le nombre maximum de participant'),
  startAt: validDate('La date de début'),
  description: validString('La description'),
  coachId: positiveNumber('CoachId'),
  durationMinutes: positiveNumber('Le temps de la séance'),
})

export const createCourseSchema = courseSchema.omit({ id: true })
export const partialCourseSchema = courseSchema.partial()
