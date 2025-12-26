import { Request, Response, Router } from 'express'
import bcrypt from 'bcrypt'
import { UserService as us } from '../service/user'
import { hundlerValidator } from '../middleware/validator'
import { upload } from '../middleware/upload'
import fs from 'fs/promises'

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

async function hashedPassword(password: string) {
  const hashed = await bcrypt.hash(password, Number(process.env.SALT_ROUND))
  return hashed
}

router.post('/', async (req: Request, res: Response) => {
  const { name, surname, age, weight, phone, email, password, role } = req.body

  const validInput = await hundlerValidator([
    { string: name },
    { string: surname },
    { email: email },
    { phoneNumber: phone },
    { number: age },
    { number: weight },
  ])

  if (validInput != true) return hundlerResponse(res, 400, false, validInput)

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
  return hundlerResponse(res, 200, true, user)
})

router.get('/', async (req: Request, res: Response) => {
  const users = await us.findAll()
  return hundlerResponse(res, 200, true, users)
})

router.get('/:id', async (req: Request, res: Response) => {
  const validInput = await hundlerValidator([{ id: Number(req.params.id) }])

  if (validInput != true) return hundlerResponse(res, 400, false, validInput)

  const user = await us.findById(Number(req.params.id))
  if (user == 'NOT-EXIST')
    return hundlerResponse(res, 404, false, 'Id incorect')
  return hundlerResponse(res, 200, true, user)
})

router.put('/:id', async (req: Request, res: Response) => {
  const { name, surname, age, weight, email, password, phone, role } = req.body

  const validInput = await hundlerValidator([
    { string: name },
    { string: surname },
    { email: email },
    { phoneNumber: phone },
    { number: age },
    { number: weight },
    { id: Number(req.params.id) },
  ])

  if (validInput != true) return hundlerResponse(res, 400, false, validInput)

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
    return hundlerResponse(res, 404, false, 'Id incorect')
  }

  return hundlerResponse(res, 200, true, user)
})

router.delete('/:id', async (req: Request, res: Response) => {
  const validInput = await hundlerValidator([{ id: Number(req.params.id) }])

  if (validInput != true) return hundlerResponse(res, 400, false, validInput)

  const user = await us.delete(Number(req.params.id))
  if (user == 'NOT-EXIST') {
    return hundlerResponse(res, 404, false, 'Utilisateur introuvable')
  }
  return hundlerResponse(res, 200, true, user)
})

router.put(
  '/:id/profile-image',
  upload.single('profileImage'),
  async (req: Request, res: Response) => {
    if (req.file == undefined)
      return hundlerResponse(res, 400, false, 'Fichier manquant')

    const validInput = await hundlerValidator([{ id: Number(req.params.id) }])
    if (validInput != true) return hundlerResponse(res, 400, false, validInput)

    const filePath = `public/profileImage/${req.file?.filename}`
    const updated = await us.updateImage(Number(req.params.id), filePath)
    return hundlerResponse(res, 200, true, updated)
  },
)

router.delete(
  '/:id/profile-image',
  upload.single('profileImage'),
  async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const validInput = await hundlerValidator([{ id: id }])
    if (validInput != true) return hundlerResponse(res, 400, false, validInput)

    const user = await us.findById(id)
    if (user == 'NOT-EXIST') {
      return hundlerResponse(res, 400, false, user)
    }
    if (user.imageUri.includes('default.png')) {
      return hundlerResponse(res, 404, false, 'Aucune image enregistrée')
    }
    const fileRemove = await fs.unlink(`./${user.imageUri}`)
    console.log(fileRemove)

    const reset = await us.resetImage(Number(req.params.id))
    return hundlerResponse(res, 200, true, 'ok')
  },
)
export default router
