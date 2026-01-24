import { NextFunction, Request, Response } from 'express'
import logger from '../config/logger'

export function handlerResponse(
  res: Response,
  status: number,
  success: boolean,
  json: any,
) {
  return res.status(status).json({
    success: success,
    data: json,
    timestamp: new Date().toISOString(),
  })
}

export function globalErrorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Server error', {
    message: error.message,
    name: error.name,
    stack: error.stack,
    method: req.method,
    path: req.path,
  })

  // Vérifier si res.status existe (cas des réponses partielles du router)
  if (typeof res.status !== 'function') {
    logger.error('Response object missing status method:', {
      method: req.method,
      path: req.path,
    })
    return
  }

  if (error.name === 'ValidationError') {
    return handlerResponse(res, 400, false, error.message)
  }

  if (error.name === 'CastError') {
    return handlerResponse(res, 400, false, 'ID invalide')
  }

  if (error.name === 'TooManyRequestsError') {
    return handlerResponse(res, 429, false, error.message)
  }

  return handlerResponse(res, 500, false, 'Erreur serveur')
}

export function notFoundHandler(req: Request, res: Response) {
  return handlerResponse(res, 404, false, 'Route non trouvée')
}
