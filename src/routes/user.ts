import { Request, Response, Router } from 'express'
import bcrypt from 'bcrypt'
import { UserService as us } from '../service/user'

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
  const user = await us.findById(Number(req.params.id))
  if (user == 'NOT-EXIST')
    return hundlerResponse(res, 404, false, 'Id incorect')
  return hundlerResponse(res, 200, true, user)
})

router.put('/:id', async (req: Request, res: Response) => {
  const { name, surname, age, weight, email, password, phone, role } = req.body

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
  const user = await us.delete(Number(req.params.id))

  if (user == 'NOT-EXIST') {
    return hundlerResponse(res, 404, false, 'Utilisateur introuvable')
  }

  const imageUri = user.imageUri

  if (!imageUri.includes('default.png')) {
    await fs.unlink(`./${imageUri}`)
  }

  return hundlerResponse(res, 200, true, user)
})

// gestion image Utilisateur
router.put(
  '/:id/profile-image',
  upload.single('profileImage'),
  async (req: Request, res: Response) => {
    if (!req.file) return hundlerResponse(res, 400, false, 'Fichier manquant')
    const validInput = await hundlerValidator([{ id: Number(req.params.id) }])
    if (validInput != true) return hundlerResponse(res, 400, false, validInput)

    const user = await us.findById(Number(req.params.id))
    if (user == 'NOT-EXIST') {
      return hundlerResponse(res, 400, false, user)
    }
    if (!user.imageUri.includes('default.png')) {
      await fs.unlink(user.imageUri)
    }

    const filePath = `public/profileImage/${req.file.filename}`
    const updated = await us.updateImage(Number(req.params.id), filePath)
    return hundlerResponse(res, 200, true, updated)
  },
)

router.delete('/:id/profile-image', async (req: Request, res: Response) => {
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
  await fs.unlink(`./${user.imageUri}`)
  await us.resetImage(Number(req.params.id))
  return hundlerResponse(res, 200, true, 'ok')
})

// gestion programme Utilisateur
router.put(
  '/:id/prog',
  upload.single('statsFile'),
  async (req: Request, res: Response) => {
    if (!req.file) return hundlerResponse(res, 400, false, 'fichier manquant')

    const validInput = await hundlerValidator([{ id: Number(req.params.id) }])
    if (validInput != true) return hundlerResponse(res, 400, false, validInput)

    const user = await us.findById(Number(req.params.id))
    if (user == 'NOT-EXIST') {
      return hundlerResponse(res, 404, false, 'Utilisateur introuvable')
    }
    if (user.progUri != null) {
      await fs.unlink(user.progUri)
    }
    await fs.unlink(`./${user.imageUri}`)
    await us.resetImage(Number(req.params.id))
    return hundlerResponse(res, 200, true, 'ok')
  },
)

router.delete('/:id/prog', async (req: Request, res: Response) => {
  const id = Number(req.params.id)

  const validInput = await hundlerValidator([{ id: id }])
  if (validInput != true) return hundlerResponse(res, 400, false, validInput)

  const user = await us.findById(id)
  if (user == 'NOT-EXIST') {
    return hundlerResponse(res, 400, false, user)
  }
  if (user.progUri == null) {
    return hundlerResponse(res, 404, false, 'Aucun programme enregistrée')
  }
  await fs.unlink(`./${user.progUri}`)

  const removeFile = await us.removeProg(id)
  return hundlerResponse(res, 200, true, removeFile)
})

export default router
