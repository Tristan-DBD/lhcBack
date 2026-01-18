import { Request, Response, Router } from 'express'
import prisma from '../db-config'
import { supabase } from '../config/supabase'
import { handlerResponse } from '../middleware/handler'
import { rateLimiter } from '../middleware/rateLimiter'
import { authenticate } from '../middleware/auth'
import { authorize } from '../middleware/authorize'

const router = Router()

const checkDatabaseConnection = async () => {
  const start = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    return {
      status: 'Connected',
      responseTime: Date.now() - start + 'ms',
    }
  } catch (error) {
    return {
      status: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start + 'ms',
    }
  }
}

const checkSupabaseConnection = async () => {
  const start = Date.now()

  try {
    const client = supabase()
    if (!client) return { status: 'NOT_INITIALIZED' }

    const { error } = await client.storage.listBuckets()

    return {
      status: error ? 'error' : 'connected',
      responseTime: Date.now() - start + 'ms',
      error: error?.message,
    }
  } catch (error) {
    return {
      status: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start + 'ms',
    }
  }
}

router.get('/', 
  rateLimiter(1, 5, { motif: 'health' }), 
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseConnection()
  const supabaseHealth =
    process.env.NODE_ENV === 'prod'
      ? await checkSupabaseConnection()
      : { status: 'disabled' }

  const data = {
    status: dbHealth.status === 'Connected' ? 'healthy' : 'unhealthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),

    application: {
      name: process.env.npm_package_name || 'lhcBack',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      port: process.env.PORT || 4000,
      startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    },

    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      },
    },

    dependencies: {
      database: dbHealth,
      supabase: supabaseHealth,
    },
  }

  const statusCode = data.status === 'healthy' ? 200 : 503
  return handlerResponse(res, statusCode, true, data)
})

router.get('/database',
  rateLimiter(1, 5, { motif: 'health' }), 
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseConnection()
  return handlerResponse(
    res,
    dbHealth.status === 'Connected' ? 200 : 503,
    true,
    dbHealth,
  )
})
export default router
