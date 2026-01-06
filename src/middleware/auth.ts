import { NextFunction, Request, Response } from 'express'
import hundlerResponse from './hundler'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: string
  }
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return hundlerResponse(res, 401, false, 'Unauthorized')
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as {
      sub: string
      role: string
    }
    req.user = {
      id: decoded.sub,
      role: decoded.role,
    }

    next()
  } catch {
    return hundlerResponse(res, 401, false, 'Invalid token')
  }
}
