import { NextFunction, Response } from 'express'
import { AuthRequest } from './auth'
import { handlerResponse } from './handler'

const ROLE_ACCESS: Record<string, string[]> = {
  ATHLETE_CO: ['CO', 'PROFILE'],
  ATHLETE_PROG: ['PROG', 'PROFILE'],
  ATHLETE_FULL: ['PROG', 'CO', 'PROFILE', 'COACH'],
  COACH: ['CO', 'PROG', 'PROFILE', 'COACH'],
  ADMIN: ['CO', 'PROG', 'PROFILE', 'COACH', 'ADMIN'],
}

export const authorize =
  (...allowedRoles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return handlerResponse(res, 401, false, 'Unauthorized')
    }

    const userRole = req.user.role
    const allowed = allowedRoles.some((role) =>
      ROLE_ACCESS[userRole]?.includes(role),
    )
    if (!allowed) {
      return handlerResponse(res, 403, false, 'Forbidden')
    }

    next()
  }
