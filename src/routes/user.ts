import { Request, Response, Router } from 'express'
import bcrypt from 'bcrypt'
import { UserService as us } from '../service/user'
import { hash } from 'node:crypto'

const router = Router()

function hundlerResponse(res: Response, status: number, message: any) {
  return res.status(status).json(message)
}

async function hashedPassword(password: string) {
  const hashed = await bcrypt.hash(password, Number(process.env.SALT_ROUND))
  console.log(hashed)
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
    return hundlerResponse(res, 409, 'Utilisateur déjà existant')
  return hundlerResponse(res, 200, user)
})

router.get('/', async (req: Request, res: Response) => {
  const users = await us.findAll()
  return hundlerResponse(res, 200, users)
})

router.get('/:id', async (req: Request, res: Response) => {
  const user = await us.findById(Number(req.params.id))
  if (user == 'NOT-EXIST') return hundlerResponse(res, 404, 'Id incorect')
  return hundlerResponse(res, 200, user)
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
    return hundlerResponse(res, 404, 'Id incorect')
  }

  return hundlerResponse(res, 200, user)
})

router.delete('/:id', async (req: Request, res: Response) => {
  const user = await us.delete(Number(req.params.id))
  if (user == 'NOT-EXIST') {
    return hundlerResponse(res, 404, 'Utilisateur introuvable')
  }
  return hundlerResponse(res, 200, user)
})

export default router
