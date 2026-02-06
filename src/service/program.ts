import prisma from '../db-config'

export const ProgramService = {
  async create(userId: number, name: string, fileUri: string) {
    return await prisma.program.create({
      data: {
        userId: userId,
        name: name,
        fileUri: fileUri,
      },
    })
  },

  async findByUser(userId: number) {
    return await prisma.program.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
    })
  },

  async delete(id: number) {
    return await prisma.program.delete({
      where: { id },
    })
  },
}
