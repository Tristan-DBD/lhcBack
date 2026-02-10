import { Request, Response, Router } from 'express'
import { FileService, upload } from '../middleware/upload'
import { handlerResponse } from '../middleware/handler'
import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/authorize'
import { rateLimiter } from '../middleware/rateLimiter'
import { ProgramService } from '../service/program'
import validate from '../middleware/validate'
import { idSchema } from '../schemas/common'
import { deleteProgramSchema } from '../schemas/program'
import { invalidateCacheMiddleware, cachePatterns } from '../middleware/cache'

const router = Router()

// Créer un programme pour un utilisateur
router.post(
  '/:id',
  rateLimiter(1, 10, { motif: 'program' }),
  validate(idSchema),
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.users.all]),
  upload.single('programFile'),
  async (req: Request, res: Response) => {
    const userId = Number(req.params.id)

    if (!req.file) return handlerResponse(res, 400, false, 'Fichier manquant')

    const filePath = await FileService.save(req.file, 'prog')

    const name = filePath.split('/').pop()!.split('.').slice(0, -1).join('.')
    const program = await ProgramService.create(userId, name, filePath)

    return handlerResponse(res, 201, true, program)
  },
)

router.get(
  '/:id',
  rateLimiter(1, 10, { motif: 'program' }),
  validate(idSchema),
  authenticate,
  authorize('PROG'),
  async (req: Request, res: Response) => {
    const userId = Number(req.params.id)
    const program = await ProgramService.findByUser(userId)
    console.log(program)
    return handlerResponse(res, 200, true, program)
  },
)

// Supprimer un programme
router.delete(
  '/:id',
  rateLimiter(1, 10, { motif: 'program' }),
  validate(deleteProgramSchema),
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.users.all]),
  async (req: Request, res: Response) => {
    const userId = Number(req.params.id)
    const { name } = req.body

    const program = await ProgramService.findByUser(userId)
    if (!program[0]) {
      return handlerResponse(
        res,
        404,
        false,
        'Aucun programme trouvé pour cette utilisateur',
      )
    }

    const programToDelete = program.find((p) => p.name === name)
    if (!programToDelete) {
      return handlerResponse(
        res,
        404,
        false,
        'Aucun programme trouvé avec ce nom',
      )
    }

    if (programToDelete.fileUri) {
      const fileName = programToDelete.fileUri.split('/').pop()
      await FileService.delete(`prog/${fileName}`)
    }

    await ProgramService.delete(programToDelete.id)
    return handlerResponse(res, 200, true, 'Programme supprimé')
  },
)

export default router
