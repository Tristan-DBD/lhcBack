import { Request, Response, Router } from 'express'
import validate from '../middleware/validate'
import { createCourseSchema, partialCourseSchema } from '../schemas/course'
import { coursesService as cs } from '../service/course'
import hundlerResponse from '../middleware/hundler'
import { idSchema } from '../schemas/user'
import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/authorize'

const router = Router()

router.post(
  '/',
  authenticate,
  authorize('COACH'),
  validate(createCourseSchema),
  async (req: Request, res: Response) => {
    const created = await cs.create(
      req.body.title,
      req.body.maxParticipants,
      new Date(req.body.startAt),
      req.body.coachId,
      req.body.durationMinutes,
      req.body.description,
    )
    return hundlerResponse(res, 201, true, created)
  },
)

router.get('/', authenticate, async (req: Request, res: Response) => {
  const courses = await cs.findAll()
  return hundlerResponse(res, 200, true, courses)
})

router.get(
  '/:id',
  authenticate,
  validate(idSchema),
  async (req: Request, res: Response) => {
    const course = await cs.findById(Number(req.params.id))
    if (course == 'NOT-EXIST') {
      return hundlerResponse(res, 404, false, 'Cours non trouvé')
    }
    return hundlerResponse(res, 200, true, course)
  },
)

router.put(
  '/:id',
  validate(partialCourseSchema),
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const exist = await cs.findById(Number(req.params.id))
    if (exist == 'NOT-EXIST') {
      return hundlerResponse(res, 404, false, 'Cours non trouvé')
    }

    const course = await cs.update(Number(req.params.id), req.body)
    return hundlerResponse(res, 200, true, course)
  },
)
router.delete(
  '/:id',
  authenticate,
  authorize('COACH'),
  validate(idSchema),
  async (req: Request, res: Response) => {
    const exist = await cs.findById(Number(req.params.id))
    if (exist == 'NOT-EXIST') {
      return hundlerResponse(res, 404, false, 'Cours non trouvé')
    }
    const course = await cs.delete(Number(req.params.id))
    return hundlerResponse(res, 200, true, course)
  },
)

export default router
