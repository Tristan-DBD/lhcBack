import { Request, Response, Router } from 'express'
import { ShopService as ss } from '../service/shop'
import { FileService, upload } from '../middleware/upload'
import { handlerResponse } from '../middleware/handler'
import validate from '../middleware/validate'
import { createProductSchema } from '../schemas/shop'
import { idSchema } from '../schemas/common'
import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/authorize'
import { rateLimiter } from '../middleware/rateLimiter'

const router = Router()

// Créer un produit
router.post(
  '/',
  rateLimiter(60, 10, { motif: 'shop-create' }),
  authenticate,
  authorize('COACH'),
  upload.single('productImage'),
  validate(createProductSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, sizes, price } = req.body
      let imageUri: string | undefined

      if (req.file) {
        imageUri = await FileService.save(req.file, 'productImage')
      }

      // Parser les tailles si elles viennent sous forme de string (JSON) depuis multipart/form-data
      const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes

      const product = await ss.create(
        name,
        parsedSizes,
        Number(price),
        imageUri,
      )
      return handlerResponse(res, 201, true, product)
    } catch (error) {
      return handlerResponse(
        res,
        500,
        false,
        `Erreur lors de la création : ${error}`,
      )
    }
  },
)

// Mettre à jour le prix d'un produit
router.put(
  '/:id/price',
  rateLimiter(1, 100, { motif: 'shop-update' }),
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const { price } = req.body
    const product = await ss.updatePrice(Number(req.params.id), Number(price))
    if (product == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Produit introuvable')
    }
    return handlerResponse(res, 200, true, product)
  },
)

// Lister les produits
router.get(
  '/',
  rateLimiter(1, 60, { motif: 'shop-get' }),
  authenticate,
  async (req: Request, res: Response) => {
    const products = await ss.findAll()
    return handlerResponse(res, 200, true, products)
  },
)

// Récupérer un produit par ID
router.get(
  '/:id',
  rateLimiter(1, 60, { motif: 'shop-get' }),
  validate(idSchema),
  authenticate,
  async (req: Request, res: Response) => {
    const product = await ss.findById(Number(req.params.id))
    if (product == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Produit introuvable')
    }
    return handlerResponse(res, 200, true, product)
  },
)

// Mettre à jour le stock d'une taille spécifique
router.put(
  '/:id/stock/:size',
  rateLimiter(1, 100, { motif: 'shop-update' }),
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const { quantity } = req.body
    const size = req.params.size as string
    const product = await ss.updateStock(
      Number(req.params.id),
      size,
      Number(quantity),
    )
    if (product == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Produit ou taille introuvable')
    }
    return handlerResponse(res, 200, true, product)
  },
)

// Ajouter une nouvelle taille à un produit existant
router.post(
  '/:id/size',
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string)
    const { size } = req.body

    if (!size) {
      return handlerResponse(res, 400, false, 'La taille est requise')
    }

    const result = await ss.addSize(id, size)

    if (result === 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Produit non trouvé')
    }

    if (result === 'ALREADY-EXISTS') {
      return handlerResponse(res, 400, false, 'Cette taille existe déjà')
    }

    return handlerResponse(res, 201, true, result)
  },
)

// Mettre à jour l'image d'un produit
router.put(
  '/:id/image',
  authenticate,
  authorize('COACH'),
  upload.single('productImage'),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string)
    let imageUri: string | undefined

    if (req.file) {
      const { FileService } = require('../middleware/upload')
      imageUri = await FileService.save(req.file, 'productImage')
    }

    if (!imageUri) {
      return handlerResponse(res, 400, false, "L'image est requise")
    }

    const result = await ss.updateImage(id, imageUri)

    if (result === 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Produit non trouvé')
    }

    return handlerResponse(res, 200, true, result)
  },
)

// Supprimer une taille spécifique d'un produit
router.delete(
  '/:id/stock/:size',
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string)
    const size = req.params.size as string

    const result = await ss.deleteStockBySize(id, size)

    if (result === 'NOT-EXIST') {
      return handlerResponse(
        res,
        404,
        false,
        'Taille non trouvée pour ce produit',
      )
    }

    return handlerResponse(res, 200, true, 'Taille supprimée')
  },
)

// Supprimer un produit
router.delete(
  '/:id',
  rateLimiter(60, 5, { motif: 'shop-delete' }),
  validate(idSchema),
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    const result = await ss.delete(Number(req.params.id))
    if (result == 'NOT-EXIST') {
      return handlerResponse(res, 404, false, 'Produit introuvable')
    }
    return handlerResponse(res, 200, true, 'Produit supprimé')
  },
)

export default router
