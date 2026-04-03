import { Request, Response, Router } from 'express'
import validate from '../middleware/validate'
import {
  createCoachingSlotSchema,
  partialCoachingSlotSchema,
  slotBookingSchema,
  coachingSlotQuerySchema,
} from '../schemas/coaching_slot'
import { coachingSlotService as cs } from '../service/coaching_slot'
import {
  handlerResponse,
  handlerPaginatedResponse,
} from '../middleware/handler'
import { idSchema } from '../schemas/common'
import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/authorize'
import { rateLimiter } from '../middleware/rateLimiter'
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
  cachePatterns,
} from '../middleware/cache'

const router = Router()

// Helper function pour gérer les réponses de booking
const handleBookingResult = (
  result:
    | 'NOT-EXIST'
    | 'ALREADY-BOOKED'
    | 'ALREADY-TAKEN'
    | { id: number; userId: number; slotId: number; bookedAt: Date },
  res: Response,
) => {
  switch (result) {
    case 'NOT-EXIST':
      return handlerResponse(res, 404, false, 'Créneau non trouvé')
    case 'ALREADY-BOOKED':
      return handlerResponse(res, 400, false, 'Déjà réservé par vous')
    case 'ALREADY-TAKEN':
      return handlerResponse(res, 400, false, 'Créneau déjà réservé')
    default:
      // result is now a booking object
      return handlerResponse(res, 200, true, 'Réservation réussie')
  }
}

// Helper function pour gérer les réponses de cancellation
const handleCancelResult = (
  result:
    | 'NOT-EXIST'
    | 'NOT-BOOKED'
    | { id: number; userId: number; slotId: number; bookedAt: Date },
  res: Response,
) => {
  switch (result) {
    case 'NOT-EXIST':
      return handlerResponse(res, 404, false, 'Créneau non trouvé')
    case 'NOT-BOOKED':
      return handlerResponse(res, 400, false, 'Non réservé par vous')
    default:
      // result is now a booking object
      return handlerResponse(res, 200, true, 'Réservation annulée')
  }
}

// Middleware commun pour les routes de booking
const bookingMiddleware = [
  rateLimiter(1, 40, { motif: 'booking' }),
  validate(slotBookingSchema),
  authenticate,
]

// Middleware commun pour les routes de cancel
const cancelMiddleware = [
  rateLimiter(1, 40, { motif: 'cancel' }),
  validate(slotBookingSchema),
  authenticate,
]

router.post(
  '/',
  rateLimiter(1, 20, { motif: 'create' }),
  validate(createCoachingSlotSchema),
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.coachingSlots.all]),
  async (req: Request, res: Response) => {
    const created = await cs.create(
      req.body.coachId,
      new Date(req.body.startTime),
      new Date(req.body.endTime),
    )
    return handlerResponse(res, 201, true, created)
  },
)

router.get(
  '/',
  rateLimiter(1, 40, { motif: 'get' }),
  authenticate,
  authorize('CO'),
  async (req: Request, res: Response) => {
    const parsed = coachingSlotQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return handlerResponse(
        res,
        400,
        false,
        parsed.error.issues[0]?.message ?? 'Paramètres de requête invalides',
      )
    }
    const { page, limit, startDate, endDate, coachId } = parsed.data
    const sDate = startDate ? new Date(startDate) : undefined
    const eDate = endDate ? new Date(endDate) : undefined

    const { data, total } = await cs.findAll({
      page,
      limit,
      ...(sDate ? { startDate: sDate } : {}),
      ...(eDate ? { endDate: eDate } : {}),
      ...(coachId ? { coachId } : {}),
    })
    return handlerPaginatedResponse(res, data, { total, page, limit })
  },
)

router.get(
  '/:id',
  rateLimiter(1, 60, { motif: 'get' }),
  validate(idSchema),
  authenticate,
  authorize('CO'),
  cacheMiddleware('coaching-slot', {
    ttl: 600, // Cache de 10 minutes pour les entités individuelles
    keyGenerator: (req) => `coaching-slot:${req.params.id}`,
  }),
  async (req: Request, res: Response) => {
    const slot = await cs.findById(Number(req.params.id))
    if (slot == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Créneau non trouvé')
    }
    return handlerResponse(res, 200, true, slot)
  },
)

router.put(
  '/:id',
  rateLimiter(1, 20, { motif: 'update' }),
  validate(partialCoachingSlotSchema),
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.coachingSlots.all]),
  async (req: Request, res: Response) => {
    const exist = await cs.findById(Number(req.params.id))
    if (exist == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Créneau non trouvé')
    }

    const updateData: any = {}
    if (req.body.coachId !== undefined) updateData.coachId = req.body.coachId
    if (req.body.startTime !== undefined)
      updateData.startTime = new Date(req.body.startTime)
    if (req.body.endTime !== undefined)
      updateData.endTime = new Date(req.body.endTime)

    const slot = await cs.update(Number(req.params.id), updateData)

    return handlerResponse(res, 200, true, slot)
  },
)

router.delete(
  '/:id',
  rateLimiter(1, 20, { motif: 'delete' }),
  validate(idSchema),
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.coachingSlots.all]),
  async (req: Request, res: Response) => {
    const exist = await cs.findById(Number(req.params.id))
    if (exist == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Créneau non trouvé')
    }
    const slot = await cs.delete(Number(req.params.id))
    return handlerResponse(res, 200, true, slot)
  },
)

router.post(
  '/book',
  ...bookingMiddleware,
  async (req: Request, res: Response) => {
    const { userId, slotId } = req.body
    const result = await cs.bookSlot(userId, slotId)
    return handleBookingResult(result, res)
  },
)

router.post(
  '/cancel',
  ...cancelMiddleware,
  async (req: Request, res: Response) => {
    const { userId, slotId } = req.body
    const result = await cs.cancelBooking(userId, slotId)
    return handleCancelResult(result, res)
  },
)

router.get(
  '/bookings/:id',
  rateLimiter(1, 40, { motif: 'get-bookings' }),
  validate(idSchema),
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const slotId = Number(req.params.id)

    // Vérifier si le créneau existe
    const slot = await cs.findById(slotId)
    if (!slot || slot === 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Créneau non trouvé')
    }

    const bookings = await cs.getBookings(slotId)
    return handlerResponse(res, 200, true, bookings)
  },
)

export default router
