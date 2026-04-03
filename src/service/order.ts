import prisma from '../db-config'

export const OrderService = {
  async create(
    userId: number,
    items: { productId: number; size: string; quantity: number }[],
  ) {
    // 1. Calculer le total et vérifier le stock
    let total = 0
    const itemDetails = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { stocks: true },
      })

      if (!product) throw new Error(`Produit ${item.productId} non trouvé`)

      const stock = product.stocks.find((s) => s.size === item.size)
      if (!stock)
        throw new Error(
          `Taille ${item.size} non trouvée pour le produit ${product.name}`,
        )

      // On permet la commande même si stock <= 0 (pré-commande)
      // Mais on enregistre le prix actuel
      total += product.price * item.quantity
      itemDetails.push({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
        price: product.price,
      })

      // 2. Décrémenter le stock (peut devenir négatif)
      await prisma.productStock.update({
        where: { id: stock.id },
        data: { quantity: stock.quantity - item.quantity },
      })
    }

    // 3. Créer la commande
    return await prisma.order.create({
      data: {
        userId,
        total,
        status: 'PENDING',
        items: {
          create: itemDetails,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    })
  },

  async findAll() {
    return await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async findByUserId(userId: number) {
    return await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async updateStatus(orderId: number, status: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!order) return 'NOT-EXIST'

    // Handle stock changes if changing to or from CANCELLED state
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      // Re-créditer les stocks
      for (const item of order.items) {
        if (item.productId && item.size) {
          const stock = await prisma.productStock.findFirst({
            where: { productId: item.productId, size: item.size },
          })
          if (stock) {
            await prisma.productStock.update({
              where: { id: stock.id },
              data: { quantity: stock.quantity + item.quantity },
            })
          }
        }
      }
    } else if (order.status === 'CANCELLED' && status !== 'CANCELLED') {
      // Déduire les stocks si on repasse la commande en actif
      for (const item of order.items) {
        if (item.productId && item.size) {
          const stock = await prisma.productStock.findFirst({
            where: { productId: item.productId, size: item.size },
          })
          if (stock) {
            await prisma.productStock.update({
              where: { id: stock.id },
              data: { quantity: Math.max(0, stock.quantity - item.quantity) },
            })
          }
        }
      }
    }

    return await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    })
  },

  async cancelOrder(orderId: number, userId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) return 'NOT-EXIST'
    if (order.userId !== userId) return 'UNAUTHORIZED'
    if (order.status !== 'PENDING') return 'ALREADY-PROCESSED'

    // Re-créditer le stock
    for (const item of order.items) {
      if (item.productId && item.size) {
        const stock = await prisma.productStock.findFirst({
          where: { productId: item.productId, size: item.size },
        })
        if (stock) {
          await prisma.productStock.update({
            where: { id: stock.id },
            data: { quantity: stock.quantity + item.quantity },
          })
        }
      }
    }

    return await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    })
  },

  async getAggregatedSummary() {
    // Récupérer tous les OrderItems des commandes non annulées
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          status: { notIn: ['CANCELLED', 'COMPLETED'] },
        },
      },
      include: {
        product: true,
      },
    })

    // Aggrégation par produit et taille
    const summary: Record<string, any> = {}

    for (const item of items) {
      const key = `${item.productId}_${item.size}`
      if (!summary[key]) {
        summary[key] = {
          productId: item.productId,
          productName: item.product.name,
          size: item.size,
          quantity: 0,
        }
      }
      summary[key].quantity += item.quantity
    }

    return Object.values(summary)
  },
}
