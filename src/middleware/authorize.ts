import { NextFunction, Response } from 'express'
import { AuthRequest } from './auth'
import hundlerResponse from './hundler'

export const authorize =
  (...allowedRoles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return hundlerResponse(res, 401, false, 'Unauthorized')
    }

    if (!allowedRoles.includes(req.user.role)) {
      return hundlerResponse(res, 403, false, 'Forbidden')
    }

    next()
  }
