import { Body, Consumes, Example, Post, Route, Tags } from 'tsoa'
import { Role } from '@prisma/client'

class loginDto {
  @Example('tristan')
  username!: string

  @Example('1234')
  password!: string
}

class registerDto {
  @Example('Tristan')
  name!: string

  @Example('Debord')
  surname!: string

  @Example(23)
  age!: number

  @Example(85)
  weight!: number

  @Example('0601020304')
  phone!: string

  @Example('tdebord')
  username!: string

  @Example('1234')
  password!: string

  @Example(Role.ATHLETE_PROG)
  role!: Role
}

@Route('auth')
@Tags('Authentication')
export class AuthController {
  @Post('/login')
  @Consumes('application/json')
  public async login(@Body() body: loginDto) {
    return body
  }

  @Post('/register')
  @Consumes('application/json')
  public async register(@Body() body: registerDto) {
    return body
  }
}
