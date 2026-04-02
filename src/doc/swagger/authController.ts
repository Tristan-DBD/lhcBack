import { Body, Example, Post, Route, Security, Tags } from 'tsoa'
// Role import removed since it's a type and we need a string value for examples

export class loginDto {
  @Example('tristan')
  username!: string

  @Example('1234')
  password!: string
}

export class registerDto {
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

export class changePasswordDto {
  @Example('123456')
  newPassword!: string
}

@Route('auth')
@Tags('Authentication')
export class AuthController {
  @Post('/login')
  public async login(@Body() body: loginDto): Promise<any> {
    return body
  }

  @Post('/register')
  public async register(@Body() body: registerDto): Promise<any> {
    return body
  }

  @Post('/change-password')
  @Security('BearerAuth')
  public async changePassword(@Body() body: changePasswordDto): Promise<any> {
    return body
  }
}
