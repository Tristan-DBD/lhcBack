import { Request, Response, NextFunction } from 'express'
import logger from '../config/logger'

export const errorLogger = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error('Unhandled Error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
    },
    user: (req as any).user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
  })

  next(error)
}
