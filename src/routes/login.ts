import { Request, Response, Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserService as us } from '../service/user'
import { Role } from '@prisma/client'
import { handlerResponse } from '../middleware/handler'
import { rateLimiter } from '../middleware/rateLimiter'
import { loginSchema } from '../schemas/auth'
import { createUserSchema } from '../schemas/user'
import validate from '../middleware/validate'

const router = Router()

const DEFAULT_PASSWORD = '123456'

function generateUsername(name: string, surname: string): string {
  return (name.charAt(0) + surname).toLowerCase().replace(/\s/g, '')
}

export async function createToken(id: number, role: Role, username: string) {
  const payload = { id, role, username }
  const token = jwt.sign(payload, String(process.env.JWT_SECRET), {
    expiresIn: '1H',
  })
  return token
}

router.post(
  '/login',
  rateLimiter(1, 5, { motif: 'login', skipSuccessful: true }),
  validate(loginSchema),
  async (req: Request, res: Response) => {
    const { username, password } = req.body
    const user = await us.findByUsernameWithPassword(username)
    if (user == 'NOT-EXIST') {
      return handlerResponse(
        res,
        403,
        false,
        'Username ou mot de passe incorect',
      )
    }
    const validPassword = await bcrypt.compare(password, user.password)
    if (validPassword == false) {
      return handlerResponse(
        res,
        409,
        false,
        'Username ou mot de passe incorect',
      )
    }
    return handlerResponse(
      res,
      200,
      true,
      await createToken(user.id, user.role, user.username),
    )
  },
)

router.post(
  '/register',
  rateLimiter(60, 3, { motif: 'register', skipSuccessful: true }),
  validate(createUserSchema),
  async (req: Request, res: Response) => {
    const { name, surname, age, weight, phone, role } = req.body

    const username = generateUsername(name, surname)
    const hashed = await bcrypt.hash(
      DEFAULT_PASSWORD,
      Number(process.env.SALT_ROUND),
    )

    const allowedRoles = ['ATHLETE_CO', 'ATHLETE_PROG', 'ATHLETE_FULL']

    const finalRole =
      role && allowedRoles.includes(role) ? role : 'ATHLETE_PROG'

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

    if (user == 'ALREADY-EXIST') {
      return handlerResponse(res, 409, false, 'Utilisateur déjà existant')
    }
    return handlerResponse(
      res,
      200,
      true,
      await createToken(user.id, user.role, user.username),
    )
  },
)

export default router
