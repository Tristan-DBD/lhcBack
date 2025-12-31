import { NextFunction, Request, Response } from 'express'
import { ZodError, ZodType } from 'zod'
import hundlerResponse from './hundler'

export default function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // permet de combiner tous les types de req, pour tous vérifier
      const data = { ...req.params, ...req.body, ...req.query }
      schema.parse(data)
      next() // si valide continue
    } catch (error: any) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))

        return hundlerResponse(res, 400, false, formattedErrors)
      }

      // Autre type d'erreur
      return hundlerResponse(res, 500, false, 'Erreur serveur')
    }
  }
}
