/* eslint-disable quotes */
import { z } from 'zod'
import { positiveNumber } from './common'

export const statsSchema = z.object({
  userId: positiveNumber("L'id de l'utilisateur"),
  squat: positiveNumber('Squat'),
  bench: positiveNumber('Bench'),
  deadlift: positiveNumber('Deadlift'),
})

export const createStatsSchema = statsSchema
export const partialStatsSchema = statsSchema.partial()
