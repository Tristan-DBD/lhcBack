import { Request, Response, Router } from 'express'
import { OrderService as os } from '../service/order'
import { handlerResponse } from '../middleware/handler'
import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/authorize'
import { rateLimiter } from '../middleware/rateLimiter'
import {
  cachePatterns,
  invalidateCacheMiddleware,
  cacheMiddleware,
} from '../middleware/cache'
import validate from '../middleware/validate'
import { updateOrderStatusSchema } from '../schemas/shop'

const router = Router()

// Créer une commande (Athlète)
router.post(
  '/',
  rateLimiter(60, 5, { motif: 'order-create' }),
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id
      const { items } = req.body

      if (!items || !Array.isArray(items) || items.length === 0) {
        return handlerResponse(res, 400, false, 'Le panier est vide')
      }

      const order = await os.create(userId, items)
      return handlerResponse(res, 201, true, order)
    } catch (error) {
      return handlerResponse(
        res,
        500,
        false,
        `Erreur lors de la commande : ${error instanceof Error ? error.message : error}`,
      )
    }
  },
)

// Lister toutes les commandes (Coach)
router.get(
  '/',
  authenticate,
  authorize('COACH'),
  cacheMiddleware('orders', { ttl: 60 }), // Short 1 minute cache since orders update dynamically
  async (req: Request, res: Response) => {
    try {
      const orders = await os.findAll()
      return handlerResponse(res, 200, true, orders)
    } catch {
      return handlerResponse(
        res,
        500,
        false,
        'Erreur lors de la récupération des commandes',
      )
    }
  },
)

// Lister mes commandes (Athlète)
router.get('/my', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const orders = await os.findByUserId(userId)
    return handlerResponse(res, 200, true, orders)
  } catch {
    return handlerResponse(
      res,
      500,
      false,
      'Erreur lors de la récupération de vos commandes',
    )
  }
})

// Annuler ma commande (Athlète)
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const orderId = Number(req.params.id)
    const result = await os.cancelOrder(orderId, userId)

    if (result === 'NOT-EXIST')
      return handlerResponse(res, 404, false, 'Commande introuvable')
    if (result === 'UNAUTHORIZED')
      return handlerResponse(res, 403, false, 'Action non autorisée')
    if (result === 'ALREADY-PROCESSED')
      return handlerResponse(
        res,
        400,
        false,
        "Impossible d'annuler une commande déjà en cours",
      )

    return handlerResponse(res, 200, true, 'Commande annulée')
  } catch {
    return handlerResponse(res, 500, false, "Erreur lors de l'annulation")
  }
})

// Résumé global de production (Coach)
router.get(
  '/summary',
  authenticate,
  authorize('COACH'),
  async (req: Request, res: Response) => {
    try {
      const summary = await os.getAggregatedSummary()
      return handlerResponse(res, 200, true, summary)
    } catch {
      return handlerResponse(res, 500, false, 'Erreur lors du résumé')
    }
  },
)

// Mettre à jour le statut (Coach)
router.patch(
  '/:id/status',
  authenticate,
  authorize('COACH'),
  validate(updateOrderStatusSchema),
  invalidateCacheMiddleware([cachePatterns.orders.all]),
  async (req: Request, res: Response) => {
    try {
      const { status } = req.body
      const order = await os.updateStatus(Number(req.params.id), status)

      if (order === 'NOT-EXIST')
        return handlerResponse(res, 404, false, 'Commande introuvable')

      return handlerResponse(res, 200, true, order)
    } catch {
      return handlerResponse(res, 500, false, 'Erreur lors de la mise à jour')
    }
  },
)

export default router
