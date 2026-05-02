import { OrderStatus } from '@prisma/client'
import prisma from '../db-config'

export const OrderService = {
  async create(
    userId: string,
    items: { productId: string; size: string; quantity: number }[],
  ) {
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

      total += product.price * item.quantity
      itemDetails.push({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
        price: product.price,
      })

      await prisma.productStock.update({
        where: { id: stock.id },
        data: { quantity: stock.quantity - item.quantity },
      })
    }

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

  async findByUserId(userId: string) {
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

  async updateStatus(orderId: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!order) return 'NOT-EXIST'

    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
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

  async cancelOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) return 'NOT-EXIST'
    if (order.userId !== userId) return 'UNAUTHORIZED'
    if (order.status !== 'PENDING') return 'ALREADY-PROCESSED'

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
