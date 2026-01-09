import {
  Body,
  Consumes,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Route,
  Tags,
  Security,
} from 'tsoa'
import { statService as ss } from '../../service/stats'

@Route('stats')
@Tags('Stats')
export class StatsController {
  @Post('/')
  @Security('BearerAuth')
  @Consumes('application/json')
  public async create(
    @Body()
    body: {
      userId: number
      squat: number
      bench: number
      deadlift: number
    },
  ) {
    return ss.create(body.userId, body.squat, body.bench, body.deadlift)
  }

  @Get('/')
  @Security('BearerAuth')
  public async getAll() {
    return ss.findAll()
  }

  @Get('/{id}')
  @Security('BearerAuth')
  public async getById(@Path() id: number) {
    return ss.findById(id)
  }

  @Put('/')
  @Security('BearerAuth')
  @Consumes('application/json')
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
  @Security('BearerAuth')
  public async delete(@Path() id: number) {
    return ss.delete(id)
  }
}
