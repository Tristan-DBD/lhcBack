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
      userId: string
      squat: number
      bench: number
      deadlift: number
    },
  ): Promise<any> {
    return {} as any
  }

  @Get('/')
  @Security('BearerAuth')
  public async getAll(): Promise<any[]> {
    return [] as any
  }

  @Get('/{id}')
  @Security('BearerAuth')
  public async getById(@Path() id: string): Promise<any> {
    return {} as any
  }

  @Put('/')
  @Security('BearerAuth')
  @Consumes('application/json')
  public async update(
    @Body()
    body: {
      userId: string
      squat: number
      bench: number
      deadlift: number
    },
  ): Promise<any> {
    return {} as any
  }

  @Delete('/{id}')
  @Security('BearerAuth')
  public async delete(@Path() id: string): Promise<any> {
    return {} as any
  }
}
