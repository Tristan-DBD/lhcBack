import { Request, Response, Router } from 'express'
import bcrypt from 'bcrypt'
import { UserService as us } from '../service/user'
import { FileService, upload } from '../middleware/upload'
import { handlerResponse } from '../middleware/handler'
import validate from '../middleware/validate'
import { createUserSchema, partialUserSchema } from '../schemas/user'
import { idSchema } from '../schemas/common'
import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/authorize'
import programRoute from './program'
import { rateLimiter } from '../middleware/rateLimiter'
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
  cachePatterns,
} from '../middleware/cache'
import { ProgramService } from '../service/program'

const DEFAULT_PASSWORD = '123456'

function generateUsername(name: string, surname: string): string {
  const timestamp = Date.now().toString(36).slice(-4)
  return (name.charAt(0) + surname + timestamp).toLowerCase().replace(/\s/g, '')
}

const router = Router()
router.use('/program', programRoute)
async function hashedPassword(password: string) {
  const hashed = await bcrypt.hash(password, Number(process.env.SALT_ROUND))
  return hashed
}

router.post(
  '/',
  rateLimiter(60, 10, { motif: 'register' }),
  validate(createUserSchema),
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.users.all]),
  async (req: Request, res: Response) => {
    const { name, surname, age, weight, phone, role } = req.body
    const allowedRoles = ['ATHLETE_CO', 'ATHLETE_PROG', 'ATHLETE_FULL']

    const finalRole =
      role && allowedRoles.includes(role) ? role : 'ATHLETE_PROG'

    const username = generateUsername(name, surname)
    const hashed = await hashedPassword(DEFAULT_PASSWORD)
    const user = await us.create(
      name,
      surname,
      age,
      weight,
      username,
      phone,
      hashed,
      finalRole,
    )

    if (user == 'ALREADY-EXIST')
      return handlerResponse(res, 409, false, 'Utilisateur déjà existant')
    return handlerResponse(res, 201, true, user)
  },
)

router.post(
  '/coach',
  rateLimiter(60, 3, { motif: 'register', skipSuccessful: true }),
  validate(createUserSchema),
  authenticate,
  authorize('ADMIN'),
  invalidateCacheMiddleware([cachePatterns.users.all]),
  async (req: Request, res: Response) => {
    const { name, surname, age, weight, phone } = req.body
    const role = 'COACH'

    const username = generateUsername(name, surname)
    const hashed = await hashedPassword(DEFAULT_PASSWORD)
    const user = await us.create(
      name,
      surname,
      age,
      weight,
      username,
      phone,
      hashed,
      role,
    )

    if (user == 'ALREADY-EXIST')
      return handlerResponse(res, 409, false, 'Utilisateur déjà existant')
    return handlerResponse(res, 201, true, user)
  },
)

router.get(
  '/',
  rateLimiter(1, 20, { motif: 'get' }),
  authenticate,
  authorize('COACH'),
  cacheMiddleware('users', { ttl: 300 }), // Cache de 5 minutes pour la liste
  async (req: Request, res: Response) => {
    const users = await us.findAll()
    return handlerResponse(res, 200, true, users)
  },
)

router.get(
  '/get-coach',
  rateLimiter(1, 60, { motif: 'get' }),
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const users = await us.findAllCoach()
    if (users == null)
      return handlerResponse(res, 404, false, 'Aucun coach trouvé')
    return handlerResponse(res, 200, true, users)
  },
)

router.get(
  '/:id',
  rateLimiter(1, 60, { motif: 'get' }),
  validate(idSchema),
  authenticate,
  authorize('PROFILE'),
  cacheMiddleware('users', {
    ttl: 600, // Cache de 10 minutes pour les profils individuels
    keyGenerator: (req) => `users:${req.params.id}`,
  }),
  async (req: Request, res: Response) => {
    const user = await us.findById(Number(req.params.id))
    if (user == 'NOT-EXIST')
      return handlerResponse(res, 404, false, 'Id incorrect')
    return handlerResponse(res, 200, true, user)
  },
)

router.put(
  '/:id',
  rateLimiter(60, 5, { motif: 'update' }),
  validate(partialUserSchema),
  authenticate,
  authorize('PROFILE'),
  invalidateCacheMiddleware([cachePatterns.users.all]),
  async (req: Request, res: Response) => {
    const { name, surname, age, weight, username, password, phone } = req.body
    let hashed
    if (password == undefined) {
      hashed = null
    } else {
      hashed = await hashedPassword(password)
    }

    const data = {
      ...(name && { name: name }),
      ...(surname && { surname: surname }),
      ...(age && { age: age }),
      ...(weight && { weight: weight }),
      ...(phone && { phone: phone }),
      ...(username && { username: username }),
      ...(password && { password: hashed }),
    }
    const user = await us.update(Number(req.params.id), { ...data })
    if (user == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Id incorrect')
    }

    return handlerResponse(res, 200, true, user)
  },
)

router.delete(
  '/:id',
  rateLimiter(60, 5, { motif: 'delete' }),
  validate(idSchema),
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.users.all]),
  async (req: Request, res: Response) => {
    const deleteAllPrograms = await ProgramService.deleteAll(
      Number(req.params.id),
    )
    console.log(deleteAllPrograms)

    const user = await us.delete(Number(req.params.id))

    if (user == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Utilisateur introuvable')
    }

    if (!user.imageUri.includes('default.png')) {
      await FileService.delete(user.imageUri)
    }

    return handlerResponse(res, 204, true, user)
  },
)

// gestion image Utilisateur
router.put(
  '/:id/profile-image',
  rateLimiter(60, 10, { motif: 'profile-image' }),
  validate(idSchema),
  authenticate,
  authorize('PROFILE'),
  invalidateCacheMiddleware([cachePatterns.users.all]),
  upload.single('profileImage'),
  async (req: Request, res: Response) => {
    if (!req.file) return handlerResponse(res, 400, false, 'Fichier manquant')

    const user = await us.findById(Number(req.params.id))
    if (user == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, user)
    }
    if (!user.imageUri.includes('default.png')) {
      await FileService.delete(user.imageUri)
    }

    const filePath = await FileService.save(req.file, 'profileImage')

    const updated = await us.updateImage(Number(req.params.id), filePath)
    return handlerResponse(res, 200, true, updated)
  },
)

router.delete(
  '/:id/profile-image',
  rateLimiter(60, 10, { motif: 'profile-image' }),
  validate(idSchema),
  authenticate,
  authorize('PROFILE'),
  invalidateCacheMiddleware([cachePatterns.users.all]),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id)

    const user = await us.findById(id)
    if (user == 'NOT-EXIST') {
      return handlerResponse(res, 400, false, user)
    }
    if (user.imageUri.includes('default.png')) {
      return handlerResponse(res, 404, false, 'Aucune image enregistrée')
    }

    await FileService.delete(user.imageUri)

    await us.resetImage(Number(req.params.id))
    return handlerResponse(res, 200, true, 'ok')
  },
)

export default router
