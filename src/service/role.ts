import prisma from '../db-config'

export const RoleService = {
  async findAll() {
    return await prisma.role.findMany()
  },

  async findByName(name: string) {
    return await prisma.role.findUnique({
      where: { name },
    })
  },

  async findById(id: number) {
    return await prisma.role.findUnique({
      where: { id },
    })
  },

  async create(name: string, description?: string) {
    return await prisma.role.create({
      data: { name, description: description ?? null },
    })
  },

  async getOrCreate(name: string, description?: string) {
    const role = await this.findByName(name)
    if (role) return role
    return await this.create(name, description)
  },
}
