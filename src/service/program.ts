import prisma from '../db-config'

export const ProgramService = {
  async create(userId: string, name: string, fileUri: string) {
    return await prisma.program.create({
      data: {
        userId: userId,
        name: name,
        fileUri: fileUri,
      },
    })
  },

  async findByUser(userId: string) {
    return await prisma.program.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
    })
  },

  async delete(id: string) {
    return await prisma.program.delete({
      where: { id },
    })
  },

  async deleteAll(userId: string) {
    return await prisma.program.deleteMany({
      where: { userId },
    })
  },
}
