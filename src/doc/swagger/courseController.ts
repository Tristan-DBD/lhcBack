import { Body, Delete, Get, Path, Post, Put, Route, Security, Tags } from 'tsoa'
import { coursesService as cs } from '../../service/course'

@Route('course')
@Tags('Cours Collectifs')
export class CourseController {
  @Post('/')
  @Security('BearerAuth')
  public async create(
    @Body()
    body: {
      title: string
      maxParticipants: number
      startAt: Date
      coachId: number
      durationMinutes: number
      description: string
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
  public async getById(@Path() id: number): Promise<any> {
    return {} as any
  }

  @Put('/{id}')
  @Security('BearerAuth')
  public async update(
    @Path() id: number,
    @Body()
    body: {
      title: string
      maxParticipants: number
      startAt: Date
      coachId: number
      durationMinutes: number
      description: string
    },
  ): Promise<any> {
    return {} as any
  }

  @Delete('/{id}')
  @Security('BearerAuth')
  public async delete(@Path() id: number): Promise<any> {
    return {} as any
  }

  @Post('/register')
  @Security('BearerAuth')
  public async register(
    @Body() body: { userId: number; courseId: number },
  ): Promise<any> {
    return {} as any
  }

  @Delete('/unregister')
  @Security('BearerAuth')
  public async unregister(
    @Body() body: { userId: number; courseId: number },
  ): Promise<any> {
    return {} as any
  }

  @Get('/registrations/{courseId}')
  @Security('BearerAuth')
  public async getRegistrations(@Path() courseId: number): Promise<any[]> {
    return [] as any
  }
}
