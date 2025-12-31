import { Response } from 'express'

export default function hundlerResponse(
  res: Response,
  status: number,
  success: boolean,
  json: any,
) {
  return res.status(status).json({
    success: success,
    data: json,
  })
}
