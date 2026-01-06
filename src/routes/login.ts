import { Request, Response, Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserService as us } from '../service/user'
import { Role } from '@prisma/client'
import hundlerResponse from '../middleware/hundler'

const router = Router()

export async function createToken(id: number, role: Role, email: string) {
  const payload = { id, role, email }
  const token = jwt.sign(payload, String(process.env.JWT_SECRET), {
    expiresIn: '1H',
  })
  return token
}

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  const user = await us.findByEmail(email)
  if (user == 'NOT-EXIST') {
    return hundlerResponse(res, 403, false, 'Email ou mot de passe incorect')
  }
  const validPassword = await bcrypt.compare(password, user.password)
  if (validPassword == false) {
    return hundlerResponse(res, 409, false, 'Email ou mot de passe incorect')
  }
  return hundlerResponse(
    res,
    200,
    true,
    await createToken(user.id, user.role, user.email),
  )
})

router.post('/register', async (req: Request, res: Response) => {
  const { name, surname, age, weight, phone, email, password, role } = req.body

  const hashed = await bcrypt.hash(password, Number(process.env.SALT_ROUND))

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

  if (user == 'ALREADY-EXIST') {
    return hundlerResponse(res, 409, false, 'Utilisateur déjà existant')
  }
  return hundlerResponse(
    res,
    200,
    true,
    await createToken(user.id, user.role, user.email),
  )
})

export default router
