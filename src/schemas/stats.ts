import { z } from 'zod'
import { positiveNumber } from './common'

export const statsSchema = z.object({
  userId: positiveNumber('UserId'),
  squat: positiveNumber('Squat'),
  bench: positiveNumber('Bench'),
  deadlift: positiveNumber('Deadlift'),
})

export const createStatsSchema = statsSchema
export const partialStatsSchema = statsSchema.partial()
