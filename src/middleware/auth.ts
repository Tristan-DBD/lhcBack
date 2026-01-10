import { NextFunction, Request, Response } from 'express'
import { handlerResponse } from './handler'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: string
  }
  timestamp?: number
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return handlerResponse(res, 401, false, 'Unauthorized')
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as {
      id: string
      role: string
      email: string
    }
    req.user = {
      id: decoded.id,
      role: decoded.role,
    }

    next()
  } catch {
    return handlerResponse(res, 401, false, 'Invalid token')
  }
}
