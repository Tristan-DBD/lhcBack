import { Request, Response } from 'express'

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

export function globalErrorHandler(error: Error, req: Request, res: Response) {
  console.error('Error:', error.message, {
    name: error.name,
    method: req.method,
    url: req.url,
  })

  // Vérifier si res.status existe (cas des réponses partielles du router)
  if (typeof res.status !== 'function') {
    console.error('Response object missing status method:', {
      method: req.method,
      url: req.url,
    })
    return
  }

  if (error.name === 'ValidationError') {
    return handlerResponse(res, 400, false, error.message)
  }

  if (error.name === 'CastError') {
    return handlerResponse(res, 400, false, 'ID invalide')
  }

  return handlerResponse(res, 500, false, 'Erreur serveur')
}

export function notFoundHandler(req: Request, res: Response) {
  return handlerResponse(res, 404, false, 'Route non trouvée')
}
