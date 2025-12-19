/* eslint-disable quotes */
import { Request, Response, Router } from 'express'
import { statService as ss } from '../service/stats'

const router = Router()

function hundlerResponse(
  res: Response,
  status: number,
  success: boolean,
  json: any,
) {
  return res.status(status).json({
    success: success,
    data: json,
  })
}

router.post('/', async (req: Request, res: Response) => {
  const { userId, squat, bench, deadlift } = req.body

  const stats = await ss.create(userId, squat, bench, deadlift)

  if (stats == 'ALREADY_EXIST') {
    return hundlerResponse(res, 409, false, 'Cet utilisateur à déjà des stats ')
  }
  if (stats == 'USER_NOT_EXIST') {
    return hundlerResponse(res, 404, false, 'Utilisateur introuvable')
  }
  return hundlerResponse(res, 200, true, stats)
})

router.get('/', async (req: Request, res: Response) => {
  const stats = await ss.findAll()
  return hundlerResponse(res, 200, true, stats)
})

router.get('/:id', async (req: Request, res: Response) => {
  const stats = await ss.findById(Number(req.params.id))
  return hundlerResponse(res, 200, true, stats)
})

router.put('/', async (req: Request, res: Response) => {
  const { userId, squat, bench, deadlift } = req.body

  const updated = await ss.update(userId, squat, bench, deadlift)

  if (updated == 'STATS_NOT_FOUND')
    return hundlerResponse(
      res,
      409,
      false,
      "L'utilisateur n'as pas fiche de stats renseignée",
    )

  return hundlerResponse(res, 200, true, updated)
})

router.delete('/:id', async (req: Request, res: Response) => {
  const exist = await ss.findById(Number(req.params.id))
  if (exist == null) {
    return hundlerResponse(res, 404, false, "La fiche de stats n'existe pas ")
  }

  const deleted = await ss.delete(Number(req.params.id))
  return hundlerResponse(res, 200, true, deleted)
})
export default router
