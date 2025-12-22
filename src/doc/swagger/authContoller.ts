import { Body, Controller, Post, Response, Route, Tags } from 'tsoa'
import { UserService as us } from '../../service/user'
import bcrypt from 'bcrypt'
import { createToken } from '../../routes/login'
import { hundlerValidator } from '../../middleware/validator'

type LoginSuccessResponse = {
  token: string
}

type LoginErrorResponse = {
  error: string
}

type RegisterSuccessResponse = {
  token: string
}

type RegisterErrorResponse = {
  error: string
}

@Route('auth')
@Tags('Auth')
export class AuthController extends Controller {
  @Post('/login')
  @Response<LoginErrorResponse>(400, 'Bad Request')
  @Response<LoginErrorResponse>(401, 'Unauthorized')
  public async login(
    @Body()
    body: {
      email: string
      password: string
    },
  ): Promise<LoginSuccessResponse | LoginErrorResponse> {
    const { email, password } = body

    const validInput = await hundlerValidator([{ email: email }])
    if (validInput != true) {
      this.setStatus(400)
      return { error: JSON.stringify(validInput) }
    }

    // 🔒 Validation basique
    if (!email || !password) {
      this.setStatus(400)
      return { error: 'INVALID_CREDENTIALS: email et mot de passe requis' }
    }

    const user = await us.findByEmail(email)
    if (user === 'NOT-EXIST') {
      this.setStatus(401)
      return { error: 'INVALID_CREDENTIALS: email ou mot de passe incorrect' }
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      this.setStatus(401)
      return { error: 'INVALID_CREDENTIALS: email ou mot de passe incorrect' }
    }

    // ✅ Succès
    return {
      token: await createToken(user.id, user.role, user.email),
    }
  }

  @Post('/register')
  @Response<RegisterErrorResponse>(400, 'Bad Request')
  @Response<RegisterErrorResponse>(409, 'Conflict')
  public async register(
    @Body()
    body: {
      name: string
      surname: string
      age: number
      weight: number
      phone: string
      email: string
      password: string
      role: 'ATHLETE' | 'COACH'
    },
  ): Promise<RegisterSuccessResponse | RegisterErrorResponse> {
    const { name, surname, age, weight, phone, email, password, role } = body

    // 🔒 Validation minimale
    if (!email || !password || !name || !surname) {
      this.setStatus(400)
      return { error: 'INVALID_INPUT: champs requis manquants' }
    }

    const hashed = await bcrypt.hash(password, Number(process.env.SALT_ROUND))

    const validInput = await hundlerValidator([
      { string: name },
      { string: surname },
      { email: email },
      { phoneNumber: phone },
      { number: age },
      { number: weight },
    ])

    if (validInput !== true) {
      this.setStatus(400)
      return { error: JSON.stringify(validInput) }
    }

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

    if (user === 'ALREADY-EXIST') {
      this.setStatus(409)
      return { error: 'USER_ALREADY_EXISTS: utilisateur déjà existant' }
    }

    this.setStatus(201)
    return {
      token: await createToken(user.id, user.role, user.email),
    }
  }
}
