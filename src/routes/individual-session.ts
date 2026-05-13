import { Request, Response, Router } from 'express'
import validate from '../middleware/validate'
import {
  createSessionSchema,
  partialSessionSchema,
  registerSchema,
  sessionQuerySchema,
} from '../schemas/individual-session'
import { individualSessionService as iss } from '../service/individual-session'
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

router.post(
  '/',
  rateLimiter(1, 20, { motif: 'create' }),
  validate(createSessionSchema),
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.courses.all]),
  async (req: Request, res: Response) => {
    const created = await iss.create(
      req.body.title,
      new Date(req.body.startAt),
      req.body.coachId,
      req.body.durationMinutes,
      req.body.description,
    )
    return handlerResponse(res, 201, true, created)
  },
)

router.get(
  '/',
  rateLimiter(1, 40, { motif: 'get' }),
  authenticate,
  authorize('PROFILE'),
  async (req: Request, res: Response) => {
    const parsed = sessionQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return handlerResponse(
        res,
        400,
        false,
        parsed.error.issues[0]?.message ?? 'Paramètres de requête invalides',
      )
    }
    const { page, limit, startDate, endDate } = parsed.data
    const sDate = startDate ? new Date(startDate) : undefined
    const eDate = endDate ? new Date(endDate) : undefined

    const { data, total } = await iss.findAll({
      page,
      limit,
      ...(sDate ? { startDate: sDate } : {}),
      ...(eDate ? { endDate: eDate } : {}),
    })
    return handlerPaginatedResponse(res, data, { total, page, limit })
  },
)

router.get(
  '/:id',
  rateLimiter(1, 60, { motif: 'get' }),
  validate(idSchema),
  authenticate,
  authorize('PROFILE'),
  cacheMiddleware('session', {
    ttl: 600,
    keyGenerator: (req) => `session:${req.params.id}`,
  }),
  async (req: Request, res: Response) => {
    const session = await iss.findById(req.params.id as string)
    if (session == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Séance non trouvée')
    }
    return handlerResponse(res, 200, true, session)
  },
)

router.put(
  '/:id',
  rateLimiter(1, 20, { motif: 'update' }),
  validate(partialSessionSchema),
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.courses.all]),
  async (req: Request, res: Response) => {
    const exist = await iss.findById(req.params.id as string)
    if (exist == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Séance non trouvée')
    }
    const session = await iss.update(req.params.id as string, req.body)
    return handlerResponse(res, 200, true, session)
  },
)

router.delete(
  '/:id',
  rateLimiter(1, 20, { motif: 'delete' }),
  validate(idSchema),
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.courses.all]),
  async (req: Request, res: Response) => {
    const exist = await iss.findById(req.params.id as string)
    if (exist == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Séance non trouvée')
    }
    const session = await iss.delete(req.params.id as string)
    return handlerResponse(res, 200, true, session)
  },
)

router.post(
  '/register',
  rateLimiter(1, 40, { motif: 'register' }),
  validate(registerSchema),
  authenticate,
  authorize('PROFILE'),
  async (req: Request, res: Response) => {
    const { userId, courseId } = req.body
    const result = await iss.register(userId, courseId)

    switch (result) {
      case 'NOT-EXIST':
        return handlerResponse(res, 404, false, 'Séance non trouvée')
      case 'ALREADY-REGISTERED':
        return handlerResponse(res, 400, false, 'Déjà inscrit à cette séance')
      case 'FULL':
        return handlerResponse(res, 400, false, 'Séance déjà réservée')
      default:
        return handlerResponse(res, 200, true, result)
    }
  },
)

router.post(
  '/unregister',
  rateLimiter(1, 40, { motif: 'unregister' }),
  validate(registerSchema),
  authenticate,
  authorize('PROFILE'),
  async (req: Request, res: Response) => {
    const { userId, courseId } = req.body
    const result = await iss.unregister(userId, courseId)

    switch (result) {
      case 'NOT-EXIST':
        return handlerResponse(res, 404, false, 'Séance non trouvée')
      case 'NOT-REGISTERED':
        return handlerResponse(res, 400, false, "Non inscrit à cette séance")
      default:
        return handlerResponse(res, 200, true, result)
    }
  },
)

router.get(
  '/registrations/:id',
  rateLimiter(1, 40, { motif: 'get-registrations' }),
  validate(idSchema),
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const courseId = req.params.id
    const session = await iss.findById(courseId as string)
    if (!session || session === 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Séance non trouvée')
    }
    const registrations = await iss.getRegistrations(courseId as string)
    return handlerResponse(res, 200, true, registrations)
  },
)

export default router
