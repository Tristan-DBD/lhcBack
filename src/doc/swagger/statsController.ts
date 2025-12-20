import {
  Body,
  Delete,
  FormField,
  Get,
  Path,
  Post,
  Put,
  Route,
  Tags,
} from 'tsoa'
import { statService as ss } from '../../service/stats'

@Route('stats')
@Tags('Stats')
export default class statsController {
  @Post('/')
  public async create(
    @FormField() userId: number,
    @FormField() squat: number,
    @FormField() bench: number,
    @FormField() deadlift: number,
  ) {
    return ss.create(userId, squat, bench, deadlift)
  }

  @Get('/')
  public async getAll() {
    return ss.findAll()
  }

  @Get('/{id}')
  public async getById(@Path() id: number) {
    return ss.findById(id)
  }

  @Put('/')
  public async update(
    @Body()
    body: {
      userId: number
      squat: number
      bench: number
      deadlift: number
    },
  ) {
    return ss.update(body.userId, body.squat, body.bench, body.deadlift)
  }

  @Delete('/{id}')
  public async delete(@Path() id: number) {
    return ss.delete(id)
  }
}
