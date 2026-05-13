import prisma from '../db-config'

function setTimeOnDate(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(dateStr)
  d.setUTCHours(h!, m!, 0, 0)
  return d
}

export const coachingSlotService = {
  async create(coachId: string, startTime: Date, endTime: Date) {
    const slot = await prisma.coachingSlot.create({
      data: {
        coachId: coachId,
        startTime: startTime,
        endTime: endTime,
      },
    })
    return slot
  },

  async findAll({
    page = 1,
    limit = 20,
    startDate,
    endDate,
    coachId,
  }: {
    page?: number
    limit?: number
    startDate?: Date
    endDate?: Date
    coachId?: string
  } = {}) {
    const skip = (page - 1) * limit
    const where = {
      ...(coachId && { coachId }),
      ...(startDate &&
        endDate && {
          startTime: {
            gte: startDate,
            lte: endDate,
          },
        }),
    }

    const [slots, total] = await Promise.all([
      prisma.coachingSlot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'asc' },
        include: {
          coach: true,
          bookings: {
            include: {
              user: true,
            },
          },
        },
      }),
      prisma.coachingSlot.count({ where }),
    ])
    return { data: slots, total }
  },

  async findById(id: string) {
    const slot = await prisma.coachingSlot.findUnique({
      where: { id },
      include: {
        coach: true,
        bookings: {
          include: {
            user: true,
          },
        },
      },
    })
    if (slot == null) return 'NOT-EXIST'
    return slot
  },

  async update(
    id: string,
    data: Partial<{
      coachId: string
      startTime: Date
      endTime: Date
    }>,
  ) {
    const slot = await prisma.coachingSlot.update({
      where: { id },
      data: data,
    })
    return slot
  },

  async delete(id: string) {
    await this.deleteAllBookings(id)
    const slot = await prisma.coachingSlot.delete({
      where: { id },
    })
    return slot
  },

  async deleteAllBookings(slotId: string) {
    const result = await prisma.slotBooking.deleteMany({
      where: { slotId },
    })
    return result
  },

  async bookSlot(userId: string, slotId: string) {
    return await prisma.$transaction(async (tx) => {
      const slot = await tx.coachingSlot.findUnique({
        where: { id: slotId },
      })
      if (slot == null) return 'NOT-EXIST'

      const existingBooking = await tx.slotBooking.findUnique({
        where: {
          slotId_userId: {
            slotId: slotId,
            userId: userId,
          },
        },
      })
      if (existingBooking != null) return 'ALREADY-BOOKED'

      const currentBookingCount = await tx.slotBooking.count({
        where: { slotId: slotId },
      })

      if (currentBookingCount >= 1) return 'ALREADY-TAKEN'

      return await tx.slotBooking.create({
        data: {
          slotId: slotId,
          userId: userId,
        },
      })
    })
  },

  async cancelBooking(userId: string, slotId: string) {
    const slot = await prisma.coachingSlot.findUnique({
      where: { id: slotId },
    })
    if (slot == null) return 'NOT-EXIST'

    const existingBooking = await prisma.slotBooking.findUnique({
      where: {
        slotId_userId: {
          slotId: slotId,
          userId: userId,
        },
      },
    })
    if (existingBooking == null) return 'NOT-BOOKED'

    const booking = await prisma.slotBooking.delete({
      where: {
        slotId_userId: {
          slotId: slotId,
          userId: userId,
        },
      },
    })
    return booking
  },

  async getBookings(slotId: string) {
    const bookings = await prisma.slotBooking.findMany({
      where: { slotId },
      include: {
        user: true,
      },
    })
    return bookings
  },

  async createBatch(coachId: string, startTimeStr: string, endTimeStr: string, startDateStr: string, endDateStr: string) {
    const start = new Date(startDateStr)
    const end = new Date(endDateStr)
    const slots: { coachId: string; startTime: Date; endTime: Date }[] = []

    const current = new Date(start)
    while (current <= end) {
      const datePart = current.toISOString().split('T')[0]!
      slots.push({
        coachId,
        startTime: setTimeOnDate(datePart, startTimeStr),
        endTime: setTimeOnDate(datePart, endTimeStr),
      })
      current.setDate(current.getDate() + 1)
    }

    return await prisma.$transaction(
      slots.map((slot) =>
        prisma.coachingSlot.create({ data: slot }),
      ),
    )
  },
}
