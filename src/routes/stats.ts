/* eslint-disable quotes */
import { Request, Response, Router } from 'express'
import { statService as ss } from '../service/stats'
import hundlerResponse from '../middleware/hundler'
import validate from '../middleware/validate'
import { partialStatsSchema, statsSchema } from '../schemas/stats'
import { idSchema } from '../schemas/common'
import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/authorize'

const router = Router()

router.post(
  '/',
  validate(statsSchema),
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const { userId, squat, bench, deadlift } = req.body

    const stats = await ss.create(userId, squat, bench, deadlift)

    if (stats == 'ALREADY_EXIST') {
      return hundlerResponse(
        res,
        409,
        false,
        'Cet utilisateur à déjà des stats ',
      )
    }
    if (stats == 'USER_NOT_EXIST') {
      return hundlerResponse(res, 404, false, 'Utilisateur introuvable')
    }
    return hundlerResponse(res, 201, true, stats)
  },
)

router.get(
  '/',
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const stats = await ss.findAll()
    return hundlerResponse(res, 200, true, stats)
  },
)

router.get(
  '/:id',
  authenticate,
  validate(idSchema),
  async (req: Request, res: Response) => {
    const stats = await ss.findById(Number(req.params.id))

    if (stats == null) {
      return hundlerResponse(res, 404, false, 'Stats introuvables')
    }
    return hundlerResponse(res, 200, true, stats)
  },
)

router.put(
  '/',
  authenticate,
  authorize('COACH'),
  validate(partialStatsSchema),
  async (req: Request, res: Response) => {
    const { userId, squat, bench, deadlift } = req.body

    const updated = await ss.update(userId, squat, bench, deadlift)

    if (updated == 'STATS_NOT_FOUND')
      return hundlerResponse(
        res,
        404,
        false,
        "L'utilisateur n'a pas fiche de stats renseignée",
      )

    return hundlerResponse(res, 200, true, updated)
  },
)

router.delete(
  '/:id',
  authenticate,
  authorize('COACH'),
  validate(idSchema),
  async (req: Request, res: Response) => {
    const exist = await ss.findById(Number(req.params.id))
    if (exist == null) {
      return hundlerResponse(res, 404, false, "La fiche de stats n'existe pas ")
    }

    await ss.delete(Number(req.params.id))
    return hundlerResponse(res, 200, true, 'Stats supprimé')
  },
)
export default router
