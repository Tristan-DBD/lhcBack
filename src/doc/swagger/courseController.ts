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
  ) {
    return cs.create(
      body.title,
      body.maxParticipants,
      body.startAt,
      body.coachId,
      body.durationMinutes,
      body.description,
    )
  }

  @Get('/')
  @Security('BearerAuth')
  public async getAll() {
    return cs.findAll()
  }

  @Get('/{id}')
  @Security('BearerAuth')
  public async getById(@Path() id: number) {
    return cs.findById(id)
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
  ) {
    return cs.update(id, body)
  }

  @Delete('/{id}')
  @Security('BearerAuth')
  public async delete(@Path() id: number) {
    return cs.delete(id)
  }

  @Post('/register')
  @Security('BearerAuth')
  public async register(@Body() body: { userId: number; courseId: number }) {
    return cs.register(body.userId, body.courseId)
  }

  @Delete('/unregister')
  @Security('BearerAuth')
  public async unregister(@Body() body: { userId: number; courseId: number }) {
    return cs.unregister(body.userId, body.courseId)
  }

  @Get('/registrations/{courseId}')
  @Security('BearerAuth')
  public async getRegistrations(@Path() courseId: number) {
    return cs.getRegistrations(courseId)
  }
}
