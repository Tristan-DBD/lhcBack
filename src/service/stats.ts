import prisma from '../db-config'
import { UserService as us } from './user'

export const statService = {
  async create(userId: number, squat: number, bench: number, deadlift: number) {
    const data = {
      userId: userId,
      squat: squat,
      bench: bench,
      deadlift: deadlift,
    }

    const existUser = await us.findById(userId)
    if (existUser == 'NOT-EXIST') return 'USER_NOT_EXIST'

    const existStats = await this.findByUserId(userId)
    if (existStats === null) {
      const stat = await prisma.stats.create({ data })
      return stat
    } else {
      return 'ALREADY_EXIST'
    }
  },

  async findAll() {
    return await prisma.stats.findMany()
  },

  async findById(id: number) {
    return await prisma.stats.findUnique({ where: { id } })
  },

  async findByUserId(userId: number) {
    return await prisma.stats.findFirst({ where: { userId: userId } })
  },

  async update(userId: number, squat: number, bench: number, deadlift: number) {
    const data = {
      ...(squat && { squat: squat }),
      ...(bench && { bench: bench }),
      ...(deadlift && { deadlift: deadlift }),
    }

    const stats = await this.findByUserId(userId)

    if (stats == null) {
      return 'STATS_NOT_FOUND'
    }

    const id = stats.id

    const updated = await prisma.stats.update({
      where: { id },
      data: { ...data },
    })

    return updated
  },

  async delete(id: number) {
    return await prisma.stats.delete({ where: { id } })
  },
}
