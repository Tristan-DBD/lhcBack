import prisma from '../db-config'
import user from '../interface/user'
import { DEFAULT_PROFILE_IMAGE } from '../constants/image'
import { RoleService } from './role'

export const UserService = {
  async create(
    name: string,
    surname: string,
    age: number,
    weight: number,
    username: string,
    phone: string,
    password: string,
    roleName: string,
  ) {
    const role = await RoleService.getOrCreate(roleName)

    const data = {
      name: name,
      surname: surname,
      age: age,
      weight: weight,
      phone: phone,
      username: username,
      password: password,
      role: { connect: { id: role.id } },
      imageUri: DEFAULT_PROFILE_IMAGE,
    }
    const exist = await this.findByusername(username)
    if (exist !== 'NOT-EXIST') return 'ALREADY-EXIST'

    const createdUser = await prisma.user.create({
      data,
      omit: {
        password: true,
      },
      include: {
        stats: true,
        programs: true,
        payments: true,
        role: true,
      },
    })

    // Initialisation automatique des paiements pour l'année en cours
    const currentYear = new Date().getFullYear()
    const { PaymentService } = require('./payment')
    await PaymentService.getOrCreatePaymentYear(createdUser.id, currentYear)

    return this.transformUser(createdUser)
  },

  async findAllCoach() {
    const list = await prisma.user.findMany({
      where: {
        role: { name: 'COACH' },
      },
      omit: {
        password: true,
      },
      include: {
        stats: true,
        programs: true,
        payments: true,
        role: true,
      },
    })
    return list.map((u: any) => this.transformUser(u))
  },

  async findAll(filters?: {
    roleNames?: string[]
    page?: number
    limit?: number
  }) {
    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 20
    const skip = (page - 1) * limit

    const where = {
      ...(filters?.roleNames &&
        filters.roleNames.length > 0 && {
          role: {
            name: { in: filters.roleNames },
          },
        }),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        omit: {
          password: true,
        },
        include: {
          stats: true,
          programs: true,
          payments: true,
          role: true,
        },
      }),
      prisma.user.count({ where }),
    ])
    return { data: users.map((u: any) => this.transformUser(u)), total }
  },

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      omit: {
        password: true,
      },
      include: {
        stats: true,
        programs: true,
        payments: true,
        role: true,
      },
    })
    if (user == null) return 'NOT-EXIST'
    return this.transformUser(user)
  },

  async findByusername(username: string) {
    const user = await prisma.user.findFirst({
      where: { username: username },
      omit: {
        password: true,
      },
      include: {
        stats: true,
        programs: true,
        payments: true,
        role: true,
      },
    })
    if (user == null) return 'NOT-EXIST'
    return this.transformUser(user)
  },

  async findByUsernameWithPassword(username: string) {
    const user = await prisma.user.findFirst({
      where: { username: username },
      include: {
        stats: true,
        programs: true,
        payments: true,
        role: true,
      },
    })
    if (user == null) return 'NOT-EXIST'
    return this.transformUser(user, true)
  },

  async update(id: string, params: Partial<user>) {
    let roleId: string | undefined
    if (params.role) {
      const role = await RoleService.getOrCreate(params.role)
      roleId = role.id
    }

    const data = {
      ...(params.name && { name: params.name }),
      ...(params.surname && { surname: params.surname }),
      ...(params.age && { age: params.age }),
      ...(params.weight && { weight: params.weight }),
      ...(params.phone && { phone: params.phone }),
      ...(params.username && { username: params.username }),
      ...(params.password && { password: params.password }),
    }
    const exist = await this.findById(id)
    if (exist == 'NOT-EXIST') return 'NOT-EXIST'

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { ...data, ...(roleId && { role: { connect: { id: roleId } } }) },
      omit: {
        password: true,
      },
      include: {
        stats: true,
        programs: true,
        payments: true,
        role: true,
      },
    })
    return this.transformUser(updatedUser)
  },

  async delete(id: string) {
    const exist = await this.findById(id)
    if (exist == 'NOT-EXIST') return 'NOT-EXIST'

    const { FileService } = require('../middleware/upload')

    const programs = await prisma.program.findMany({ where: { userId: id } })
    for (const prog of programs) {
      if (prog.fileUri) {
        try {
          await FileService.delete(prog.fileUri)
        } catch {}
      }
    }

    if (exist.imageUri && exist.imageUri !== DEFAULT_PROFILE_IMAGE) {
      try {
        await FileService.delete(exist.imageUri)
      } catch {}
    }

    await prisma.paymentYear.deleteMany({ where: { userId: id } })
    await prisma.program.deleteMany({ where: { userId: id } })
    await prisma.stats.deleteMany({ where: { userId: id } })
    await prisma.registration.deleteMany({ where: { userId: id } })
    await prisma.order.deleteMany({ where: { userId: id } })
    await prisma.refreshToken.deleteMany({ where: { userId: id } })

    const user = await prisma.user.delete({ where: { id } })
    return user
  },

  async updateImage(id: string, file: string) {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        imageUri: file,
      },
      omit: {
        password: true,
      },
      include: {
        stats: true,
        programs: true,
        payments: true,
        role: true,
      },
    })
    return this.transformUser(updated)
  },

  async resetImage(id: string) {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        imageUri: DEFAULT_PROFILE_IMAGE,
      },
      omit: {
        password: true,
      },
      include: {
        stats: true,
        programs: true,
        payments: true,
        role: true,
      },
    })
    return this.transformUser(updated)
  },

  // Helper pour transformer la relation Role en string (compatibilité frontend)
  transformUser(u: any, includePassword = false) {
    if (!u) return u
    const { role, password, ...rest } = u
    return {
      ...rest,
      role: role ? role.name : 'UNKNOWN',
      ...(includePassword && password && { password: password }),
    }
  },

  async seedRoles() {
    const roles = [
      'ADMIN',
      'COACH',
      'ATHLETE_PROG',
      'ATHLETE_CO',
      'ATHLETE_FULL',
    ]
    for (const name of roles) {
      await RoleService.getOrCreate(name)
    }
  },
}
