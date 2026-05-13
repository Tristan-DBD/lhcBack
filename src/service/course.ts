import prisma from '../db-config'

export const coursesService = {
  async create(
    title: string,
    maxParticipants: number,
    startAt: Date,
    coachId: string,
    durationMinutes: number,
    description?: string,
  ) {
    const course = await prisma.course.create({
      data: {
        title: title,
        maxParticipants: maxParticipants,
        startAt: startAt,
        coachId: coachId,
        durationMinutes: durationMinutes,
        description: description || '',
      },
    })
    return course
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
      isIndividual: false,
      ...(startDate &&
        endDate && {
          startAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
    }

    const [courses, total] = await Promise.all([
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
        },
      }),
      prisma.course.count({ where }),
    ])
    return { data: courses, total }
  },
  async findById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
    })
    if (course == null) return 'NOT-EXIST'
    return course
  },
  async update(
    id: string,
    data: Partial<{
      title: string
      maxParticipants: number
      startAt: Date
      coachId: string
      durationMinutes: number
      description: string
    }>,
  ) {
    const course = await prisma.course.update({
      where: { id },
      data: data,
    })
    return course
  },
  async deleteAllRegistrations(courseId: string) {
    const result = await prisma.registration.deleteMany({
      where: { courseId },
    })
    return result
  },
  async delete(id: string) {
    // Supprime d'abord toutes les inscriptions au cours
    await this.deleteAllRegistrations(id)

    // Puis supprime le cours
    const course = await prisma.course.delete({
      where: { id },
    })
    return course
  },
  async register(userId: string, courseId: string) {
    return await prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({
        where: { id: courseId },
      })
      if (course == null) return 'NOT-EXIST'

      const existingRegistration = await tx.registration.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: courseId,
          },
        },
      })
      if (existingRegistration != null) return 'ALREADY-REGISTERED'

      const currentRegistrationCount = await tx.registration.count({
        where: { courseId: courseId },
      })

      if (currentRegistrationCount >= course.maxParticipants) return 'FULL'

      return await tx.registration.create({
        data: {
          userId: userId,
          courseId: courseId,
        },
      })
    })
  },
  async unregister(userId: string, courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })
    if (course == null) return 'NOT-EXIST'

    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
    })
    if (existingRegistration == null) return 'NOT-REGISTERED'

    const registration = await prisma.registration.delete({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
    })
    return registration
  },
  async getRegistrations(courseId: string) {
    const registrations = await prisma.registration.findMany({
      where: { courseId },
      include: {
        user: true,
      },
    })
    return registrations
  },
}
