import { Role } from '@prisma/client'
import {
  Body,
  Consumes,
  Delete,
  Example,
  Get,
  Path,
  Post,
  Put,
  Route,
  Tags,
  UploadedFiles,
  Security,
} from 'tsoa'

class CreateUserDto {
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

  @Example(Role.ATHLETE_PROG)
  role!: Role
}

class UserResponse {
  id!: number
  name!: string
  surname!: string
  age!: number
  weight!: number
  phone!: string
  role!: string
  imageUri!: string
  username!: string
  stat!: any[]
  progUri!: any[]
  payments!: any[]
}

@Route('user')
@Tags('Utilisateur')
export class UserController {
  @Post('/')
  @Security('BearerAuth')
  @Consumes('application/json')
  public async create(@Body() body: CreateUserDto) {
    return
  }

  @Post('/coach')
  @Security('BearerAuth')
  @Consumes('application/json')
  public async createCoach(@Body() body: CreateUserDto) {
    return
  }

  @Get('/')
  @Security('BearerAuth')
  public async findAll(): Promise<UserResponse[]> {
    return [] as any
  }

  @Get('/{id}')
  @Security('BearerAuth')
  public async findById(@Path() id: number): Promise<UserResponse | string> {
    return {} as any
  }

  @Get('/get-coach')
  @Security('BearerAuth')
  public async findAllCoach(): Promise<UserResponse[]> {
    return [] as any
  }

  @Put('/{id}')
  @Security('BearerAuth')
  @Consumes('application/json')
  public async update(
    @Path() id: number,
    @Body()
    body: {
      name: string
      surname: string
      age: number
      weight: number
      phone: string
      role: Role
    },
  ): Promise<any> {
    return {} as any
  }

  @Delete('/{id}')
  @Security('BearerAuth')
  public async delete(@Path() id: number): Promise<any> {
    return {} as any
  }

  @Put('/{id}/profile-image')
  @Security('BearerAuth')
  public async imageUpdate(
    @Path() id: number,
    @UploadedFiles() profileImage: any,
  ): Promise<any> {
    return {} as any
  }

  @Delete('/{id}/profile-image')
  @Security('BearerAuth')
  public async resetProfileImage(@Path() id: number): Promise<any> {
    return {} as any
  }
}
