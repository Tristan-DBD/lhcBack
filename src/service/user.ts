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
    email: string,
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
      email: email,
      password: password,
      role: role,
      imageUri: DEFAULT_PROFILE_IMAGE,
    }
    const exist = await this.findByEmail(email)
    if (exist !== 'NOT-EXIST') return 'ALREADY-EXIST'

    const user = await prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        stat: true,
        imageUri: true,
        progUri: true,
      },
    })
    return user
  },

  async findAll() {
    const user = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        stat: true,
        imageUri: true,
        progUri: true,
      },
    })
    return user
  },

  async findById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        stat: true,
        imageUri: true,
        progUri: true,
      },
    })
    if (user == null) return 'NOT-EXIST'
    return user
  },

  async findByEmail(email: string) {
    const user = await prisma.user.findFirst({
      where: { email: email },
      include: { stat: true },
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
      ...(params.email && { email: params.email }),
      ...(params.phone && { phone: params.phone }),
      ...(params.password && { password: params.password }),
      ...(params.role && { role: params.role }),
    }
    const exist = await this.findById(id)
    if (exist == 'NOT-EXIST') return 'NOT-EXIST'

    const user = await prisma.user.update({
      where: { id },
      data: { ...data },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        stat: true,
        imageUri: true,
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
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        stat: true,
        imageUri: true,
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
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        stat: true,
        imageUri: true,
        progUri: true,
      },
    })
  },

  async updateProg(id: number, file: string) {
    return await prisma.user.update({
      where: { id: id },
      data: {
        progUri: file,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        stat: true,
        imageUri: true,
        progUri: true,
      },
    })
  },

  async removeProg(id: number) {
    return await prisma.user.update({
      where: { id: id },
      data: {
        progUri: null,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        stat: true,
        imageUri: true,
        progUri: true,
      },
    })
  },
}
