import { NextFunction, Response } from 'express'
import { AuthRequest } from './auth'
import logger from '../config/logger'

export const requestLogger = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  req.timestamp = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - Number(req.timestamp)
    const logLevel = res.statusCode == 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
    logger[logLevel]('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration} ms`,
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length'),
    })
  })

  next()
}
