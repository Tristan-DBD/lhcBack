import { Router, Response } from 'express'
import { PaymentService } from '../service/payment'
import { AuthRequest, authenticate } from '../middleware/auth'
import { handlerResponse } from '../middleware/handler'
import { authorize } from '../middleware/authorize'
import { cachePatterns, invalidateCacheMiddleware } from '../middleware/cache'

const router = Router()

/**
 * Récupérer les paiements d'un utilisateur
 */
router.get(
  '/:userId',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.userId as string)
      const payments = await PaymentService.getPaymentsByUser(userId)
      return handlerResponse(res, 200, true, payments)
    } catch (error: any) {
      return handlerResponse(res, 500, false, error.message)
    }
  },
)

/**
 * Basculer le statut d'un mois (Toggle)
 */
router.post(
  '/toggle',
  authenticate,
  authorize('COACH'),
  invalidateCacheMiddleware([cachePatterns.users.all]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId, year, month } = req.body

      const updatedPayment = await PaymentService.toggleMonth(
        userId,
        year,
        month,
      )
      return handlerResponse(res, 200, true, updatedPayment)
    } catch (error: any) {
      return handlerResponse(res, 500, false, error.message)
    }
  },
)

export default router
