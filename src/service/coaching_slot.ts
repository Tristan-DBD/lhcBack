import prisma from '../db-config'

export const coachingSlotService = {
  async create(coachId: number, startTime: Date, endTime: Date) {
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
    coachId?: number
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

  async findById(id: number) {
    const slot = await prisma.coachingSlot.findUnique({
      where: {
        id: id,
      },
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
    id: number,
    data: Partial<{
      coachId: number
      startTime: Date
      endTime: Date
    }>,
  ) {
    const slot = await prisma.coachingSlot.update({
      where: {
        id: id,
      },
      data: data,
    })
    return slot
  },

  async delete(id: number) {
    // Supprime d'abord toutes les réservations du créneau
    await this.deleteAllBookings(id)

    // Puis supprime le créneau
    const slot = await prisma.coachingSlot.delete({
      where: {
        id: id,
      },
    })
    return slot
  },

  async deleteAllBookings(slotId: number) {
    const result = await prisma.slotBooking.deleteMany({
      where: {
        slotId: slotId,
      },
    })
    return result
  },

  async bookSlot(userId: number, slotId: number) {
    return await prisma.$transaction(async (tx) => {
      // vérifie si le créneau existe et verrouille la ligne pour l'accès concurrent
      const slot = await tx.coachingSlot.findUnique({
        where: { id: slotId },
      })
      if (slot == null) return 'NOT-EXIST'

      // vérifie si déjà réservé
      const existingBooking = await tx.slotBooking.findUnique({
        where: {
          slotId_userId: {
            slotId: slotId,
            userId: userId,
          },
        },
      })
      if (existingBooking != null) return 'ALREADY-BOOKED'

      // vérifie si le créneau est déjà réservé par quelqu'un d'autre
      const currentBookingCount = await tx.slotBooking.count({
        where: { slotId: slotId },
      })

      if (currentBookingCount >= 1) return 'ALREADY-TAKEN'

      // réserve le créneau pour l'utilisateur
      return await tx.slotBooking.create({
        data: {
          slotId: slotId,
          userId: userId,
        },
      })
    })
  },

  async cancelBooking(userId: number, slotId: number) {
    const slot = await prisma.coachingSlot.findUnique({
      where: {
        id: slotId,
      },
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

  async getBookings(slotId: number) {
    const bookings = await prisma.slotBooking.findMany({
      where: {
        slotId,
      },
      include: {
        user: true,
      },
    })
    return bookings
  },
}
