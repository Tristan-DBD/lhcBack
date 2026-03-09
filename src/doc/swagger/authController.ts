import { Body, Consumes, Example, Post, Route, Tags } from 'tsoa'
// Role import removed since it's a type and we need a string value for examples

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

  @Example('ATHLETE_PROG')
  role!: string
}

class changePasswordDto {
  @Example('123456')
  newPassword!: string
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

  @Post('/change-password')
  @Consumes('application/json')
  public async changePassword(@Body() body: changePasswordDto) {
    return body
  }
}
