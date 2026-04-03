import {
  Body,
  Delete,
  Example,
  Get,
  Path,
  Post,
  Put,
  Route,
  Security,
  Tags,
} from 'tsoa'

class CreateCoachingSlotDto {
  @Example('2024-01-15T10:00:00Z')
  startAt!: Date

  @Example(60)
  durationMinutes!: number

  @Example('Séance de musculation')
  description!: string

  @Example(50)
  price!: number
}

class UpdateCoachingSlotDto {
  @Example('2024-01-15T14:00:00Z')
  startAt?: Date

  @Example(90)
  durationMinutes?: number

  @Example('Séance de cardio')
  description?: string

  @Example(60)
  price?: number
}

class SlotBookingDto {
  @Example(1)
  slotId!: number
}

class CoachingSlotResponse {
  id!: number
  coachId!: number
  startAt!: Date
  durationMinutes!: number
  description!: string
  price!: number
  isBooked!: boolean
  bookedBy?: {
    id: number
    name: string
    surname: string
  }
  createdAt!: Date
  updatedAt!: Date
}

@Route('coaching-slots')
@Tags('Créneaux Coaching')
export class CoachingSlotController {
  @Post('/')
  @Security('BearerAuth')
  public async create(@Body() body: CreateCoachingSlotDto): Promise<CoachingSlotResponse> {
    return {} as any
  }

  @Get('/')
  @Security('BearerAuth')
  public async getAll(): Promise<CoachingSlotResponse[]> {
    return [] as any
  }

  @Get('/:id')
  @Security('BearerAuth')
  public async getById(@Path() id: number): Promise<CoachingSlotResponse> {
    return {} as any
  }

  @Put('/:id')
  @Security('BearerAuth')
  public async update(
    @Path() id: number,
    @Body() body: UpdateCoachingSlotDto,
  ): Promise<CoachingSlotResponse> {
    return {} as any
  }

  @Delete('/:id')
  @Security('BearerAuth')
  public async delete(@Path() id: number): Promise<any> {
    return {} as any
  }

  @Post('/book')
  @Security('BearerAuth')
  public async book(@Body() body: SlotBookingDto): Promise<any> {
    return {} as any
  }

  @Post('/cancel')
  @Security('BearerAuth')
  public async cancel(@Body() body: SlotBookingDto): Promise<any> {
    return {} as any
  }

  @Get('/my/bookings')
  @Security('BearerAuth')
  public async getMyBookings(): Promise<CoachingSlotResponse[]> {
    return [] as any
  }
}
