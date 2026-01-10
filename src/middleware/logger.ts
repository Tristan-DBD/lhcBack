import { NextFunction, Response } from 'express'
import { AuthRequest } from './auth'

export const requestLogger = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  req.timestamp = Date.now()

  res.on('finish', () => {
    console.log(
      `${req.method} ${req.path} - ${new Date().toISOString()} - User ${req.user?.id || 'anonymous'} - Status ${res.statusCode} - Duration ${Date.now() - Number(req.timestamp)}ms`,
    )
  })

  next()
}
