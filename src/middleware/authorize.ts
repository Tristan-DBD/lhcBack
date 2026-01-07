import { NextFunction, Response } from 'express'
import { AuthRequest } from './auth'
import hundlerResponse from './hundler'

const ROLE_ACCESS: Record<string, string[]> = {
  ATHLETE_CO: ['CO'],
  ATHLETE_PROG: ['PROG'],
  COACH: ['CO', 'PROG', 'COACH'],
}

export const authorize =
  (...allowedRoles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return hundlerResponse(res, 401, false, 'Unauthorized')
    }

    const userRole = req.user.role
    const allowed = allowedRoles.some((role) =>
      ROLE_ACCESS[userRole]?.includes(role),
    )
    if (!allowed) {
      return hundlerResponse(res, 403, false, 'Forbidden')
    }

    next()
  }
