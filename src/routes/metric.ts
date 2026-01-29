import { rateLimiter } from '../middleware/rateLimiter'
import path from 'node:path'
import express, { Router } from 'express'

const router = Router()
router.use('/coverage', rateLimiter(1, 40, { motif: 'coverage' }),
    express.static(path.join(__dirname, '../../coverage')))
export default router