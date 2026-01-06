import { Request, Response, Router } from 'express'
import bcrypt from 'bcrypt'
import { UserService as us } from '../service/user'
import { FileService, upload } from '../middleware/upload'
import fs from 'fs/promises'
import validate from '../middleware/validate'
import { createUserSchema, partialUserSchema } from '../schemas/user'
import { idSchema } from '../schemas/common'
import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/authorize'
import hundlerResponse from '../middleware/hundler'

const router = Router()

async function hashedPassword(password: string) {
  const hashed = await bcrypt.hash(password, Number(process.env.SALT_ROUND))
  return hashed
}

router.post(
  '/',
  authenticate,
  authorize('COACH'),
  validate(createUserSchema),
  async (req: Request, res: Response) => {
    const { name, surname, age, weight, phone, email, password, role } =
      req.body

    const hashed = await hashedPassword(password)
    const user = await us.create(
      name,
      surname,
      age,
      weight,
      email,
      phone,
      hashed,
      role,
    )

    if (user == 'ALREADY-EXIST')
      return hundlerResponse(res, 409, false, 'Utilisateur déjà existant')
    return hundlerResponse(res, 201, true, user)
  },
)

router.get(
  '/',
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const users = await us.findAll()
    return hundlerResponse(res, 200, true, users)
  },
)

router.get(
  '/:id',
  authenticate,
  validate(idSchema),
  async (req: Request, res: Response) => {
    const user = await us.findById(Number(req.params.id))
    if (user == 'NOT-EXIST')
      return hundlerResponse(res, 404, false, 'Id incorrect')
    return hundlerResponse(res, 200, true, user)
  },
)

router.put(
  '/:id',
  authenticate,
  validate(partialUserSchema),
  async (req: Request, res: Response) => {
    const { name, surname, age, weight, email, password, phone, role } =
      req.body

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
      ...(email && { email: email }),
      ...(password && { password: hashed }),
      ...(role && { role: role }),
    }
    const user = await us.update(Number(req.params.id), { ...data })
    if (user == 'NOT-EXIST') {
      return hundlerResponse(res, 404, false, 'Id incorrect')
    }

    return hundlerResponse(res, 200, true, user)
  },
)

router.delete(
  '/:id',
  authenticate,
  authorize('COACH'),
  validate(idSchema),
  async (req: Request, res: Response) => {
    const user = await us.delete(Number(req.params.id))

    if (user == 'NOT-EXIST') {
      return hundlerResponse(res, 404, false, 'Utilisateur introuvable')
    }

    const imageUri = user.imageUri

    if (imageUri && !imageUri.includes('default.png')) {
      await fs.unlink(`./${imageUri}`)
    }

    return hundlerResponse(res, 204, true, user)
  },
)

// gestion image Utilisateur
router.put(
  '/:id/profile-image',
  validate(idSchema),
  authenticate,
  upload.single('profileImage'),
  async (req: Request, res: Response) => {
    if (!req.file) return hundlerResponse(res, 400, false, 'Fichier manquant')

    const user = await us.findById(Number(req.params.id))
    if (user == 'NOT-EXIST') {
      return hundlerResponse(res, 404, false, user)
    }
    if (!user.imageUri.includes('default.png')) {
      await FileService.delete(user.imageUri)
    }

    const filePath = await FileService.save(req.file, 'profileImage')

    const updated = await us.updateImage(Number(req.params.id), filePath)
    return hundlerResponse(res, 200, true, updated)
  },
)

router.delete(
  '/:id/profile-image',
  authenticate,
  authorize('COACH'),
  validate(idSchema),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id)

    const user = await us.findById(id)
    if (user == 'NOT-EXIST') {
      return hundlerResponse(res, 400, false, user)
    }
    if (user.imageUri.includes('default.png')) {
      return hundlerResponse(res, 404, false, 'Aucune image enregistrée')
    }

    await FileService.delete(user.imageUri)

    await us.resetImage(Number(req.params.id))
    return hundlerResponse(res, 200, true, 'ok')
  },
)

// gestion programme Utilisateur
router.put(
  '/:id/prog',
  validate(idSchema),
  authenticate,
  upload.single('statsFile'),
  authorize('COACH'),
  async (req: Request, res: Response) => {
    if (!req.file) return hundlerResponse(res, 400, false, 'Fichier manquant')

    const user = await us.findById(Number(req.params.id))
    if (user == 'NOT-EXIST') {
      return hundlerResponse(res, 404, false, 'Utilisateur introuvable')
    }
    if (user.progUri) await FileService.delete(user.progUri)

    const filePath = await FileService.save(req.file, 'prog')

    const updated = await us.updateProg(Number(req.params.id), filePath)
    return hundlerResponse(res, 200, true, updated)
  },
)

router.delete(
  '/:id/prog',
  authenticate,
  authorize('COACH'),
  validate(idSchema),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id)

    const user = await us.findById(id)
    if (user == 'NOT-EXIST') {
      return hundlerResponse(res, 400, false, user)
    }
    if (user.progUri == null) {
      return hundlerResponse(res, 404, false, 'Aucun programme enregistré')
    }

    await FileService.delete(user.progUri)

    const removeFile = await us.removeProg(id)
    return hundlerResponse(res, 200, true, removeFile)
  },
)

export default router
