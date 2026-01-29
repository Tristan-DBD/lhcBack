import { Request, Response, Router } from 'express'
import validate from '../middleware/validate'
import { createCourseSchema, partialCourseSchema, registerSchema } from '../schemas/course'
import { coursesService as cs } from '../service/course'
import { handlerResponse } from '../middleware/handler'
import { idSchema } from '../schemas/common'
import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/authorize'
import { rateLimiter } from '../middleware/rateLimiter'
import { cacheMiddleware, invalidateCacheMiddleware, cachePatterns } from '../middleware/cache'

const router = Router()

router.post(
  '/',
  rateLimiter(1, 10, { motif: 'create' }),
  validate(createCourseSchema),
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.courses.all]),
  async (req: Request, res: Response) => {
    const created = await cs.create(
      req.body.title,
      req.body.maxParticipants,
      new Date(req.body.startAt),
      req.body.coachId,
      req.body.durationMinutes,
      req.body.description,
    )
    return handlerResponse(res, 201, true, created)
  },
)

router.get('/',
  rateLimiter(1, 40, { motif: 'get' }),
  cacheMiddleware('courses', { ttl: 300 }), // Cache de 5 minutes
  authenticate,
  authorize('CO'),
  async (req: Request, res: Response) => {
    const courses = await cs.findAll()
    return handlerResponse(res, 200, true, courses)
  })

router.get(
  '/:id',
  rateLimiter(1, 60, { motif: 'get' }),
  validate(idSchema),
  cacheMiddleware('course', {
    ttl: 600, // Cache de 10 minutes pour les entités individuelles
    keyGenerator: (req) => `course:${req.params.id}`
  }),
  authenticate,
  authorize('CO'),
  async (req: Request, res: Response) => {
    const course = await cs.findById(Number(req.params.id))
    if (course == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Cours non trouvé')
    }
    return handlerResponse(res, 200, true, course)
  },
)

router.put(
  '/:id',
  rateLimiter(1, 20, { motif: 'update' }),
  validate(partialCourseSchema),
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.courses.all]),
  async (req: Request, res: Response) => {
    const exist = await cs.findById(Number(req.params.id))
    if (exist == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Cours non trouvé')
    }

    const course = await cs.update(Number(req.params.id), req.body)

    return handlerResponse(res, 200, true, course)
  },
)
router.delete(
  '/:id',
  rateLimiter(60, 5, { motif: 'delete' }),
  validate(idSchema),
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const exist = await cs.findById(Number(req.params.id))
    if (exist == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Cours non trouvé')
    }
    const course = await cs.delete(Number(req.params.id))
    return handlerResponse(res, 200, true, course)
  },
)

router.post('/register',
  rateLimiter(1, 10, { motif: 'register' }),
  validate(registerSchema),
  authenticate,
  authorize('CO'),
  async (req: Request, res: Response) => {
    const { userId, courseId } = req.body;

    const result = await cs.register(userId, courseId)

    switch (result) {
      case 'NOT-EXIST':
        return handlerResponse(res, 404, false, 'Cours non trouvé')
      case 'ALREADY-REGISTERED':
        return handlerResponse(res, 400, false, 'Déjà inscrit au cours')
      case 'FULL':
        return handlerResponse(res, 400, false, 'Cours complet')
      default:
        return handlerResponse(res, 200, true, result)
    }
  },
)

router.post('/unregister',
  rateLimiter(1, 10, { motif: 'unregister' }),
  validate(registerSchema),
  authenticate,
  authorize('CO'),
  async (req: Request, res: Response) => {

    const { userId, courseId } = req.body

    const result = await cs.unregister(userId, courseId)

    switch (result) {
      case 'NOT-EXIST':
        return handlerResponse(res, 404, false, 'Cours non trouvé')
      case 'NOT-REGISTERED':
        return handlerResponse(res, 400, false, 'Non inscrit au cours')
      default:
        return handlerResponse(res, 200, true, result)
    }
  },
)

export default router
