import prisma from '../db-config'

export const individualSessionService = {
  async create(
    title: string,
    startAt: Date,
    coachId: string,
    durationMinutes: number,
    description?: string,
  ) {
    const session = await prisma.course.create({
      data: {
        title,
        maxParticipants: 1,
        startAt,
        coachId,
        durationMinutes,
        description: description || '',
        isIndividual: true,
      },
    })
    return session
  },

  async findAll({
    page = 1,
    limit = 20,
    startDate,
    endDate,
  }: {
    page?: number
    limit?: number
    startDate?: Date
    endDate?: Date
  } = {}) {
    const skip = (page - 1) * limit
    const where = {
      isIndividual: true,
      ...(startDate &&
        endDate && {
          startAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
    }

    const [sessions, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startAt: 'asc' },
        include: {
          registrations: {
            include: {
              user: true,
            },
          },
          coach: {
            select: {
              id: true,
              name: true,
              surname: true,
            },
          },
        },
      }),
      prisma.course.count({ where }),
    ])
    return { data: sessions, total }
  },

  async findById(id: string) {
    const session = await prisma.course.findFirst({
      where: { id, isIndividual: true },
      include: {
        registrations: {
          include: { user: true },
        },
        coach: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
      },
    })
    if (session == null) return 'NOT-EXIST'
    return session
  },

  async update(
    id: string,
    data: Partial<{
      title: string
      startAt: Date
      coachId: string
      durationMinutes: number
      description: string
    }>,
  ) {
    const session = await prisma.course.update({
      where: { id },
      data,
    })
    return session
  },

  async delete(id: string) {
    await prisma.registration.deleteMany({
      where: { courseId: id },
    })
    const session = await prisma.course.delete({
      where: { id },
    })
    return session
  },

  async register(userId: string, courseId: string) {
    return await prisma.$transaction(async (tx) => {
      const session = await tx.course.findFirst({
        where: { id: courseId, isIndividual: true },
      })
      if (session == null) return 'NOT-EXIST'

      const existing = await tx.registration.findUnique({
        where: {
          userId_courseId: { userId, courseId },
        },
      })
      if (existing != null) return 'ALREADY-REGISTERED'

      const currentCount = await tx.registration.count({
        where: { courseId },
      })
      if (currentCount >= 1) return 'FULL'

      return await tx.registration.create({
        data: { userId, courseId },
      })
    })
  },

  async unregister(userId: string, courseId: string) {
    const session = await prisma.course.findFirst({
      where: { id: courseId, isIndividual: true },
    })
    if (session == null) return 'NOT-EXIST'

    const existing = await prisma.registration.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })
    if (existing == null) return 'NOT-REGISTERED'

    return await prisma.registration.delete({
      where: { userId_courseId: { userId, courseId } },
    })
  },

  async getRegistrations(courseId: string) {
    return await prisma.registration.findMany({
      where: { courseId },
      include: { user: true },
    })
  },
}
