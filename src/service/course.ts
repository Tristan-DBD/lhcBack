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
  async findAll() {
    const courses = await prisma.courses.findMany()
    return courses
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
  async delete(id: number) {
    const course = await prisma.courses.delete({
      where: {
        id: id,
      },
    })
    return course
  },
  async register(userId: number, courseId: number) {

    // vérifie si le cours existe
    const course = await prisma.courses.findUnique({
      where: {
        id: courseId,
      }
    })
    if (course == null) return 'NOT-EXIST'

    // vérifie si déjà inscrit
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_courseId: {  // clé unique composite
          userId: userId,
          courseId: courseId
        }
      }
    })
    if (existingRegistration != null) return 'ALREADY-REGISTERED'

    // vérifie si le cours est complet
    const currentRegistration = await prisma.registration.count({
      where: {
        courseId: courseId,
      }
    })
    if (currentRegistration >= course.maxParticipants) return 'FULL'

    // inscrit l'utilisateur au cours
    const registration = await prisma.registration.create({
      data: {
        userId: userId,
        courseId: courseId,
      }
    })
    return registration
  },
  async unregister(userId: number, courseId: number) {
    const course = await prisma.courses.findUnique({
      where: {
        id: courseId,
      }
    })
    if (course == null) return 'NOT-EXIST'

    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      }
    })
    if (existingRegistration == null) return 'NOT-REGISTERED'
    
    const registration = await prisma.registration.delete({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId
        }
      }
    })
    return registration
  }
}
