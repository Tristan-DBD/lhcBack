import { Role } from '@prisma/client'
import prisma from '../db-config'
import user from '../interface/user'
import { DEFAULT_PROFILE_IMAGE } from '../constants/image'

export const UserService = {
  async create(
    name: string,
    surname: string,
    age: number,
    weight: number,
    username: string,
    phone: string,
    password: string,
    role: Role,
  ) {
    const data = {
      name: name,
      surname: surname,
      age: age,
      weight: weight,
      phone: phone,
      username: username,
      password: password,
      role: role,
      imageUri: DEFAULT_PROFILE_IMAGE,
    }
    const exist = await this.findByusername(username)
    if (exist !== 'NOT-EXIST') return 'ALREADY-EXIST'

    const user = await prisma.user.create({
      data,
      omit: {
        password: true,
      },
      include: {
        stat: true,
        progUri: true,
      },
    })
    return user
  },

  async findAllCoach() {
    const list = await prisma.user.findMany({
      where: {
        role: Role.COACH,
      },
      omit: {
        password: true,
      },
      include: {
        stat: true,
        progUri: true,
      },
    })
    return list
  },

  async findAll() {
    const user = await prisma.user.findMany({
      omit: {
        password: true,
      },
      include: {
        stat: true,
        progUri: true,
      },
    })
    return user
  },

  async findById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      omit: {
        password: true,
      },
      include: {
        stat: true,
        progUri: true,
      },
    })
    if (user == null) return 'NOT-EXIST'
    return user
  },

  async findByusername(username: string) {
    const user = await prisma.user.findFirst({
      where: { username: username },
      omit: {
        password: true,
      },
      include: {
        stat: true,
        progUri: true,
      },
    })
    if (user == null) return 'NOT-EXIST'
    return user
  },

  async findByUsernameWithPassword(username: string) {
    const user = await prisma.user.findFirst({
      where: { username: username },
      include: {
        stat: true,
        progUri: true,
      },
    })
    if (user == null) return 'NOT-EXIST'
    return user
  },

  async update(id: number, params: Partial<user>) {
    const data = {
      ...(params.name && { name: params.name }),
      ...(params.surname && { surname: params.surname }),
      ...(params.age && { age: params.age }),
      ...(params.weight && { weight: params.weight }),
      ...(params.phone && { phone: params.phone }),
      ...(params.username && { username: params.username }),
      ...(params.phone && { phone: params.phone }),
      ...(params.password && { password: params.password }),
      ...(params.role && { role: params.role }),
    }
    const exist = await this.findById(id)
    if (exist == 'NOT-EXIST') return 'NOT-EXIST'

    const user = await prisma.user.update({
      where: { id },
      data: { ...data },
      omit: {
        password: true,
      },
      include: {
        stat: true,
        progUri: true,
      },
    })
    return user
  },

  async delete(id: number) {
    const exist = await this.findById(id)
    if (exist == 'NOT-EXIST') return 'NOT-EXIST'
    const user = await prisma.user.delete({ where: { id } })
    return user
  },

  async updateImage(id: number, file: string) {
    return await prisma.user.update({
      where: { id: id },
      data: {
        imageUri: file,
      },
      omit: {
        password: true,
      },
      include: {
        stat: true,
        progUri: true,
      },
    })
  },

  async resetImage(id: number) {
    return await prisma.user.update({
      where: { id: id },
      data: {
        imageUri: DEFAULT_PROFILE_IMAGE,
      },
      omit: {
        password: true,
      },
      include: {
        stat: true,
        progUri: true,
      },
    })
  },
}
