import { Request, Response, Router } from 'express'
import bcrypt from 'bcrypt'
import { UserService as us } from '../service/user'
import { AuthService } from '../service/auth'
import { handlerResponse } from '../middleware/handler'
import { rateLimiter } from '../middleware/rateLimiter'
import { changePasswordSchema, loginSchema } from '../schemas/auth'
import { createUserSchema } from '../schemas/user'
import validate from '../middleware/validate'
import { authenticate } from '../middleware/auth'

const router = Router()

const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || '123456'
const SALT_ROUNDS = Number(process.env.SALT_ROUND) || 10

function generateUsername(name: string, surname: string): string {
  return (name.charAt(0) + surname).toLowerCase()
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

    const accessToken = await AuthService.generateAccessToken(
      user.id,
      user.role,
      user.username,
    )
    const refreshToken = await AuthService.generateRefreshToken(user.id)

    return handlerResponse(res, 200, true, { accessToken, refreshToken })
  },
)

router.post(
  '/refresh',
  rateLimiter(1, 10, { motif: 'refresh' }),
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return handlerResponse(res, 400, false, 'Refresh token manquant')
    }

    const tokens = await AuthService.refreshTokens(refreshToken)
    if (!tokens) {
      return handlerResponse(
        res,
        401,
        false,
        'Refresh token invalide ou expiré',
      )
    }

    return handlerResponse(res, 200, true, tokens)
  },
)

router.post('/logout', async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (refreshToken) {
    await AuthService.revokeRefreshToken(refreshToken)
  }
  return handlerResponse(res, 200, true, 'Déconnecté')
})

router.post(
  '/register',
  rateLimiter(60, 3, { motif: 'register', skipSuccessful: true }),
  validate(createUserSchema),
  async (req: Request, res: Response) => {
    const { name, surname, age, weight, phone, role } = req.body
    const allowedRoles = ['ATHLETE_CO', 'ATHLETE_PROG', 'ATHLETE_FULL']

    const finalRole =
      role && allowedRoles.includes(role) ? role : 'ATHLETE_PROG'

    const username = generateUsername(name, surname)
    const hashed = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS)

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

    const accessToken = await AuthService.generateAccessToken(
      user.id,
      user.role,
      user.username,
    )
    const refreshToken = await AuthService.generateRefreshToken(user.id)

    return handlerResponse(res, 200, true, { accessToken, refreshToken })
  },
)

router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  async (req: Request, res: Response) => {
    const { newPassword } = req.body
    const userId = (req as any).user.id

    try {
      const hashed = await bcrypt.hash(
        newPassword,
        Number(process.env.SALT_ROUND),
      )
      await us.update(Number(userId), { password: hashed })

      return handlerResponse(
        res,
        200,
        true,
        'Mot de passe mis à jour avec succès',
      )
    } catch (e) {
      return handlerResponse(res, 500, false, 'Erreur lors de la mise à jour')
    }
  },
)

export const createToken = async (
  id: number,
  role: string,
  username: string,
) => {
  return await AuthService.generateAccessToken(id, role, username)
}

export default router
