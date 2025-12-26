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
} from 'tsoa'
import { UserService as us } from '../../service/user'

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

  @Example('admin@gmail.com')
  email!: string

  @Example('1234')
  password!: string

  @Example(Role.ATHLETE)
  role!: Role
}

@Route('user')
@Tags('Utilisateur')
export class UserController {
  @Post('/')
  @Consumes('application/json')
  public async create(@Body() body: CreateUserDto) {
    return await us.create(
      body.name,
      body.surname,
      body.age,
      body.weight,
      body.email,
      body.phone,
      body.password,
      body.role,
    )
  }

  @Get('/')
  public async findAll() {
    return us.findAll()
  }

  @Get('/{id}')
  public async findById(@Path() id: number) {
    return us.findById(id)
  }

  @Put('/{id}')
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
      email: string
      password: string
      role: Role
    },
  ) {
    return us.update(id, body)
  }

  @Delete('/{id}')
  public async delete(@Path() id: number) {
    return us.delete(id)
  }

  @Put('/{id}/profile-image')
  public async imageUpdate(
    @Path() id: number,
    @UploadedFiles() profileImage: Express.Multer.File,
  ) {
    const filePath = `public/profileImage/${profileImage.filename}`
    return us.updateImage(id, filePath)
  }

  @Delete('/{id}/profile-image')
  public async resetProfileImage(@Path() id: number) {
    return us.resetImage(id)
  }
}
