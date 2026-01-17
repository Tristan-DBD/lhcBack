import express from 'express'
import { rateLimiter } from '../middleware/rateLimiter'
import path from 'node:path'

const router = express.Router()
router.use('/coverage', rateLimiter(1, 40, { motif: 'coverage' }),
    express.static(path.join(__dirname, '../../coverage')))
export default router