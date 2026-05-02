import { Request, Response, Router } from 'express'
import { statService as ss } from '../service/stats'
import { handlerResponse } from '../middleware/handler'
import validate from '../middleware/validate'
import { partialStatsSchema, statsSchema } from '../schemas/stats'
import { idSchema } from '../schemas/common'
import { AuthRequest, authenticate } from '../middleware/auth'
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
  rateLimiter(1, 10, { motif: 'create' }),
  validate(statsSchema),
  authenticate,
  authorize('PROFILE'),
  invalidateCacheMiddleware([cachePatterns.stats.all]),
  async (req: AuthRequest, res: Response) => {
    const { userId, squat, bench, deadlift } = req.body

    // Vérifier que l'utilisateur est soit un COACH, soit le propriétaire des stats
    if (req.user?.role !== 'COACH' && Number(req.user?.id) !== Number(userId)) {
      return handlerResponse(
        res,
        403,
        false,
        'Vous n\'avez pas l\'autorisation de créer des stats pour un autre utilisateur',
      )
    }

    const stats = await ss.create(userId, squat, bench, deadlift)

    switch (stats) {
      case 'ALREADY_EXIST':
        return handlerResponse(
          res,
          409,
          false,
          'Cet utilisateur à déjà des stats ',
        )
      case 'USER_NOT_EXIST':
        return handlerResponse(res, 404, false, 'Utilisateur introuvable')
      default:
        return handlerResponse(res, 201, true, stats)
    }
  },
)

router.get(
  '/',
  rateLimiter(1, 30, { motif: 'get' }),
  authenticate,
  authorize('COACH'),
  cacheMiddleware('stats', { ttl: 120 }), // Cache de 2 minutes pour les stats (court car données changeantes)
  async (req: AuthRequest, res: Response) => {
    const stats = await ss.findAll()
    return handlerResponse(res, 200, true, stats)
  },
)

router.get(
  '/:id',
  rateLimiter(1, 60, { motif: 'get' }),
  validate(idSchema),
  authenticate,
  authorize('COACH'),
  cacheMiddleware('stat', {
    ttl: 180, // Cache de 3 minutes pour les stats individuelles
    keyGenerator: (req) => `stat:${req.params.id}`,
  }),
  async (req: AuthRequest, res: Response) => {
    const stats = await ss.findById(Number(req.params.id))

    if (stats == null) {
      return handlerResponse(res, 404, false, 'Stats introuvables')
    }
    return handlerResponse(res, 200, true, stats)
  },
)

router.put(
  '/',
  rateLimiter(1, 20, { motif: 'update' }),
  validate(partialStatsSchema),
  authenticate,
  authorize('PROFILE'),
  invalidateCacheMiddleware([cachePatterns.users.all]),
  async (req: AuthRequest, res: Response) => {
    const { userId, squat, bench, deadlift } = req.body

    // Vérifier que l'utilisateur est soit un COACH, soit le propriétaire des stats
    if (req.user?.role !== 'COACH' && Number(req.user?.id) !== Number(userId)) {
      return handlerResponse(
        res,
        403,
        false,
        'Vous n\'avez pas l\'autorisation de modifier les stats d\'un autre utilisateur',
      )
    }

    const updated = await ss.update(userId, squat, bench, deadlift)

    if (updated == 'STATS_NOT_FOUND')
      return handlerResponse(
        res,
        404,
        false,
        "L'utilisateur n'a pas fiche de stats renseignée",
      )

    return handlerResponse(res, 200, true, updated)
  },
)

router.delete(
  '/:id',
  rateLimiter(60, 5, { motif: 'delete' }),
  validate(idSchema),
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.users.all]),
  async (req: AuthRequest, res: Response) => {
    const exist = await ss.findById(Number(req.params.id))
    if (exist == null) {
      return handlerResponse(res, 404, false, "La fiche de stats n'existe pas ")
    }

    await ss.delete(Number(req.params.id))
    return handlerResponse(res, 200, true, 'Stats supprimé')
  },
)

export default router
