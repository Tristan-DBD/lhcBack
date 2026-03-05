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
    /**
     * Récupère ou crée (initialise) les paiements d'un utilisateur pour une année donnée.
     */
    static async getOrCreatePaymentYear(userId: number, year: number) {
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

    /**
     * Bascule l'état d'un mois spécifique pour une année donnée.
     */
    static async toggleMonth(userId: number, year: number, month: string) {
        const paymentYear = await this.getOrCreatePaymentYear(userId, year)
        // Créer une copie pour s'assurer que Prisma détecte le changement du JSON
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

    /**
     * Récupère tous les paiements d'un utilisateur.
     */
    static async getPaymentsByUser(userId: number) {
        return await prisma.paymentYear.findMany({
            where: { userId },
            orderBy: { year: 'desc' },
        })
    }
}
