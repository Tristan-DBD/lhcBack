import prisma from '../db-config'

export const coursesService = {
  async create(
    title: string,
    maxParticipants: number,
    startAt: Date,
    coachId: number,
    durationMinutes: number,
    description?: string,
  ) {
    const course = await prisma.courses.create({
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
      ...(startDate &&
        endDate && {
          startAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
    }

    const [courses, total] = await Promise.all([
      prisma.courses.findMany({
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
      prisma.courses.count({ where }),
    ])
    return { data: courses, total }
  },
  async findById(id: number) {
    const course = await prisma.courses.findUnique({
      where: {
        id: id,
      },
    })
    if (course == null) return 'NOT-EXIST'
    return course
  },
  async update(
    id: number,
    data: Partial<{
      title: string
      maxParticipants: number
      startAt: Date
      coachId: number
      durationMinutes: number
      description: string
    }>,
  ) {
    const course = await prisma.courses.update({
      where: {
        id: id,
      },
      data: data,
    })
    return course
  },
  async deleteAllRegistrations(courseId: number) {
    const result = await prisma.registration.deleteMany({
      where: {
        courseId: courseId,
      },
    })
    return result
  },
  async delete(id: number) {
    // Supprime d'abord toutes les inscriptions au cours
    await this.deleteAllRegistrations(id)

    // Puis supprime le cours
    const course = await prisma.courses.delete({
      where: {
        id: id,
      },
    })
    return course
  },
  async register(userId: number, courseId: number) {
    return await prisma.$transaction(async (tx) => {
      // vérifie si le cours existe et verrouille la ligne pour l'accès concurrent
      const course = await tx.courses.findUnique({
        where: { id: courseId },
      })
      if (course == null) return 'NOT-EXIST'

      // vérifie si déjà inscrit
      const existingRegistration = await tx.registration.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: courseId,
          },
        },
      })
      if (existingRegistration != null) return 'ALREADY-REGISTERED'

      // vérifie si le cours est complet
      const currentRegistrationCount = await tx.registration.count({
        where: { courseId: courseId },
      })

      if (currentRegistrationCount >= course.maxParticipants) return 'FULL'

      // inscrit l'utilisateur au cours
      return await tx.registration.create({
        data: {
          userId: userId,
          courseId: courseId,
        },
      })
    })
  },
  async unregister(userId: number, courseId: number) {
    const course = await prisma.courses.findUnique({
      where: {
        id: courseId,
      },
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
  async getRegistrations(courseId: number) {
    const registrations = await prisma.registration.findMany({
      where: {
        courseId,
      },
      include: {
        user: true,
      },
    })
    return registrations
  },
}
