import { Request, Response, Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserService as us } from '../service/user'
import { Role } from '@prisma/client'

const router = Router()

export async function createToken(id: number, role: Role, email: string) {
  const payload = { id, role, email }
  const token = await jwt.sign(payload, String(process.env.JWT_SECRET), {
    expiresIn: '1D',
  })
  return token
}

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  const user = await us.findByEmail(email)
  if (user == 'NOT-EXIST') {
    return res.status(403).json('Email ou mot de passe incorect')
  }
  const validPassword = await bcrypt.compare(password, user.password)
  if (validPassword == false) {
    return res.status(409).json('Email ou mot de passe incorect')
  }
  return res.status(200).json(await createToken(user.id, user.role, user.email))
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
    return res.status(409).json('Utilisateur déjà existant')
  }
  return res.status(200).json(await createToken(user.id, user.role, user.email))
})

export default router
