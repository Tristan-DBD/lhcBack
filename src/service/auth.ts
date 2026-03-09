import jwt from 'jsonwebtoken'
import prisma from '../db-config'
import { Role } from '@prisma/client'
import crypto from 'crypto'

export const AuthService = {
  async generateAccessToken(id: number, roleName: string, username: string) {
    const payload = { id, role: roleName, username }
    return jwt.sign(payload, String(process.env.JWT_SECRET), {
      expiresIn: '1H',
    })
  },

  async generateRefreshToken(userId: number) {
    const token = crypto.randomBytes(40).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 jours

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    })

    return token
  },

  async refreshTokens(refreshToken: string) {
    const savedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { role: true } } },
    })

    if (!savedToken || savedToken.expiresAt < new Date()) {
      if (savedToken) {
        await prisma.refreshToken.delete({ where: { id: savedToken.id } })
      }
      return null
    }

    // Générer de nouveaux jetons
    const accessToken = await this.generateAccessToken(
      savedToken.userId,
      savedToken.user.role.name,
      savedToken.user.username,
    )

    // On peut aussi rafraîchir le refresh token pour plus de sécurité (rotation)
    const newRefreshToken = await this.generateRefreshToken(savedToken.userId)

    // Supprimer l'ancien refresh token
    await prisma.refreshToken.delete({ where: { id: savedToken.id } })

    return { accessToken, refreshToken: newRefreshToken }
  },

  async revokeRefreshToken(refreshToken: string) {
    try {
      await prisma.refreshToken.delete({ where: { token: refreshToken } })
      return true
    } catch (e) {
      return false
    }
  },

  async revokeAllUserTokens(userId: number) {
    await prisma.refreshToken.deleteMany({ where: { userId } })
  },
}
