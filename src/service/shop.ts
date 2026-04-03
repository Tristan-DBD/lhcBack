import prisma from '../db-config'

export const ShopService = {
  async create(
    name: string,
    sizes: string[],
    price: number,
    imageUri?: string,
  ) {
    const product = await prisma.product.create({
      data: {
        name,
        price,
        ...(imageUri && { imageUri }),
        stocks: {
          create: sizes.map((size) => ({
            size,
            quantity: 0,
          })),
        },
      },
      include: {
        stocks: true,
      },
    })
    return product
  },

  async findAll() {
    const products = await prisma.product.findMany({
      include: {
        stocks: true,
      },
    })
    return products
  },

  async findById(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stocks: true,
      },
    })
    return product || 'NOT-EXIST'
  },

  async updateStock(productId: number, size: string, quantity: number) {
    const stock = await prisma.productStock.findFirst({
      where: { productId, size },
    })

    if (!stock) return 'NOT-EXIST'

    return await prisma.productStock.update({
      where: { id: stock.id },
      data: { quantity },
    })
  },

  async addSize(productId: number, size: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })
    if (!product) return 'NOT-EXIST'

    // Vérifier si la taille existe déjà
    const existing = await prisma.productStock.findFirst({
      where: { productId, size },
    })
    if (existing) return 'ALREADY-EXISTS'

    return await prisma.productStock.create({
      data: {
        productId,
        size,
        quantity: 0,
      },
    })
  },

  async updateImage(productId: number, imageUri: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })
    if (!product) return 'NOT-EXIST'

    const oldImage = product.imageUri

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { imageUri },
    })

    // Supprimer l'ancienne image si elle n'est pas par défaut
    if (oldImage && !oldImage.includes('default.png')) {
      const { FileService } = require('../middleware/upload')
      try {
        await FileService.delete(oldImage)
      } catch {
        console.error('Erreur suppression ancienne image')
      }
    }

    return updated
  },

  async deleteStockBySize(productId: number, size: string) {
    const stock = await prisma.productStock.findFirst({
      where: { productId, size },
    })

    if (!stock) return 'NOT-EXIST'

    return await prisma.productStock.delete({
      where: { id: stock.id },
    })
  },

  async delete(id: number) {
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return 'NOT-EXIST'

    // Suppression de l'image si ce n'est pas celle par défaut
    if (product.imageUri && !product.imageUri.includes('default.png')) {
      const { FileService } = require('../middleware/upload')
      try {
        await FileService.delete(product.imageUri)
      } catch {
        // Ignorer l'erreur si le fichier n'existe plus
      }
    }

    return await prisma.product.delete({
      where: { id },
    })
  },

  async updatePrice(id: number, price: number) {
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return 'NOT-EXIST'

    return await prisma.product.update({
      where: { id },
      data: { price },
    })
  },
}
