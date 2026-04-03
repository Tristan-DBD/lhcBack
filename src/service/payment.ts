import prisma from '../db-config'

export const DEFAULT_PAYMENT_STATUS = {
  jan: false,
  feb: false,
  mar: false,
  apr: false,
  may: false,
  jun: false,
  jul: false,
  aug: false,
  sep: false,
  oct: false,
  nov: false,
  dec: false,
}

export class PaymentService {
  static async getOrCreatePaymentYear(userId: string, year: number) {
    let paymentYear = await prisma.paymentYear.findUnique({
      where: {
        userId_year: { userId, year },
      },
    })

    if (!paymentYear) {
      paymentYear = await prisma.paymentYear.create({
        data: {
          userId,
          year,
          status: DEFAULT_PAYMENT_STATUS,
        },
      })
    }

    return paymentYear
  }

  static async toggleMonth(userId: string, year: number, month: string) {
    const paymentYear = await this.getOrCreatePaymentYear(userId, year)
    const status = { ...(paymentYear.status as Record<string, boolean>) }

    if (status[month] !== undefined) {
      status[month] = !status[month]
    } else {
      throw new Error(`Mois invalide: ${month}`)
    }

    return await prisma.paymentYear.update({
      where: { id: paymentYear.id },
      data: { status },
    })
  }

  static async getPaymentsByUser(userId: string) {
    return await prisma.paymentYear.findMany({
      where: { userId },
      orderBy: { year: 'desc' },
    })
  }
}
