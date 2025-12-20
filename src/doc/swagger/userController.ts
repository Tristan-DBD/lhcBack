import { Role } from '@prisma/client'
import {
  Body,
  Consumes,
  Delete,
  FormField,
  Get,
  Path,
  Post,
  Put,
  Route,
  Tags,
} from 'tsoa'
import { UserService as us } from '../../service/user'

@Route('user')
@Tags('Utilisateur')
export class UserController {
  @Post('/')
  @Consumes('multipart/form-data')
  public async create(
    @FormField() name: string,
    @FormField() surname: string,
    @FormField() age: number,
    @FormField() weight: number,
    @FormField() phone: string,
    @FormField() email: string,
    @FormField() password: string,
    @FormField() role: Role = Role.ATHLETE,
  ) {
    return us.create(name, surname, age, weight, email, phone, password, role)
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
}
