import prisma from '../db-config'
import { UserService as us } from './user'

async function userExist(userId: number) {
  const exist = await us.findById(userId)
  return exist
}

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
}
