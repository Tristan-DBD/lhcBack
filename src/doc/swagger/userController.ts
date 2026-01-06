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
  UploadedFile,
  UploadedFiles,
  Security,
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

  @Example('tristan.debord@gmail.com')
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
  @Security('BearerAuth')
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
  @Security('BearerAuth')
  public async findAll() {
    return us.findAll()
  }

  @Get('/{id}')
  @Security('BearerAuth')
  public async findById(@Path() id: number) {
    return us.findById(id)
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
      email: string
      password: string
      role: Role
    },
  ) {
    return us.update(id, body)
  }

  @Delete('/{id}')
  @Security('BearerAuth')
  public async delete(@Path() id: number) {
    return us.delete(id)
  }

  @Put('/{id}/profile-image')
  @Security('BearerAuth')
  public async imageUpdate(
    @Path() id: number,
    @UploadedFiles() profileImage: Express.Multer.File,
  ) {
    const filePath = `public/profileImage/${profileImage.filename}`
    return us.updateImage(id, filePath)
  }

  @Delete('/{id}/profile-image')
  @Security('BearerAuth')
  public async resetProfileImage(@Path() id: number) {
    return us.resetImage(id)
  }

  @Put('/{id}/prog')
  @Security('BearerAuth')
  public async updateProg(
    @Path() id: number,
    @UploadedFile() statsFile: Express.Multer.File,
  ) {
    const filePath = `public/prog/${statsFile.filename}`
    return us.updateProg(id, filePath)
  }

  @Delete('/{id}/prog')
  @Security('BearerAuth')
  public async removeProg(@Path() id: number) {
    return us.removeProg(id)
  }
}
