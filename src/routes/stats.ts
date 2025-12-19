import { Request, Response, Router } from 'express'
import { statService as ss } from '../service/stats'
import { stat } from 'node:fs'

const router = Router()

function hundlerResponse(res: Response, status: number, json: any) {
  return res.status(status).json(json)
}

router.post('/', async (req: Request, res: Response) => {
  const { userId, squat, bench, deadlift } = req.body

  const stats = await ss.create(userId, squat, bench, deadlift)

  if (stats == 'ALREADY_EXIST') {
    return hundlerResponse(res, 409, 'Cet utilisateur à déjà des stats ')
  }
  if (stats == 'USER_NOT_EXIST') {
    return hundlerResponse(res, 404, 'Utilisateur introuvable')
  }
  return hundlerResponse(res, 200, stats)
})

router.get('/', async (req: Request, res: Response) => {
  const stats = await ss.findAll()
  return hundlerResponse(res, 200, stats)
})

router.get('/:id', async (req: Request, res: Response) => {
  const stats = await ss.findById(Number(req.params.id))
  return hundlerResponse(res, 200, stats)
})

router.put('/:id', async (req: Request, res: Response) => {
  const { userId, squat, bench, deadlift } = req.body

  const updated = await ss.update(userId, squat, bench, deadlift)

  if (updated == 'STATS_NOT_FOUND')
    return hundlerResponse(
      res,
      409,
      'L\'utilisateur n\'as pas fiche de stats renseignée',
    )

  return hundlerResponse(res, 200, updated)
})
export default router
