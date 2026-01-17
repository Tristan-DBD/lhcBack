/* eslint-disable quotes */
import { Request, Response, Router } from 'express'
import { statService as ss } from '../service/stats'
import { handlerResponse } from '../middleware/handler'
import validate from '../middleware/validate'
import { partialStatsSchema, statsSchema } from '../schemas/stats'
import { idSchema } from '../schemas/common'
import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/authorize'
import { rateLimiter } from '../middleware/rateLimiter'

const router = Router()

router.post(
  '/',
  rateLimiter(1, 10, { motif: 'create' }),
  validate(statsSchema),
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const { userId, squat, bench, deadlift } = req.body

    const stats = await ss.create(userId, squat, bench, deadlift)

    if (stats == 'ALREADY_EXIST') {
      return handlerResponse(
        res,
        409,
        false,
        'Cet utilisateur à déjà des stats ',
      )
    }
    if (stats == 'USER_NOT_EXIST') {
      return handlerResponse(res, 404, false, 'Utilisateur introuvable')
    }
    return handlerResponse(res, 201, true, stats)
  },
)

router.get(
  '/',
  rateLimiter(1, 30, { motif: 'get' }),
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const stats = await ss.findAll()
    return handlerResponse(res, 200, true, stats)
  },
)

router.get(
  '/:id',
  rateLimiter(1, 60, { motif: 'get' }),
  authenticate,
  validate(idSchema),
  async (req: Request, res: Response) => {
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
  authenticate,
  authorize('COACH'),
  validate(partialStatsSchema),
  async (req: Request, res: Response) => {
    const { userId, squat, bench, deadlift } = req.body

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
  authenticate,
  authorize('COACH'),
  validate(idSchema),
  async (req: Request, res: Response) => {
    const exist = await ss.findById(Number(req.params.id))
    if (exist == null) {
      return handlerResponse(res, 404, false, "La fiche de stats n'existe pas ")
    }

    await ss.delete(Number(req.params.id))
    return handlerResponse(res, 200, true, 'Stats supprimé')
  },
)
export default router
