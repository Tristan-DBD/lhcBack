import dotenv from 'dotenv'
const env = process.env.NODE_ENV || 'dev'
if (env !== 'prod') {
  dotenv.config({ path: `.env.${env}` })
}

import express, { Request, Response } from 'express'
import route from './routes'
import swaggerUi from 'swagger-ui-express'
import swagger from './doc/swagger/bearer'
import path from 'path'
import {
  globalErrorHandler,
  handlerResponse,
  notFoundHandler,
} from './middleware/handler'
import { rateLimiter } from './middleware/rateLimiter'
import cors from 'cors'
import helmet from 'helmet'
import logger from './config/logger'
import { errorLogger } from './middleware/errorLogger'
import { requestLogger } from './middleware/logger'
import { cacheService } from './config/cache'

const server = express()
server.set('trust proxy', 1)
const yourIp = process.env.YOUR_IP || 'localhost'

server.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'http://localhost:4000',
          `http://${yourIp}:4000`,
          `http://${yourIp}:3000`,
          `https://${yourIp}:3000`,
          `http://${yourIp}:5000`,
          `https://${yourIp}:5000`,
          'https://vtcbjghhdlmjjwdieuxk.supabase.co', // Supabase URL
        ],
      },
    },
  }),
)

server.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:4000',
      `http://${yourIp}`,
      `http://${yourIp}:3000`,
      `http://${yourIp}:5000`,
      `http://${yourIp}:4000`,
      `https://${yourIp}`,
      `https://${yourIp}:3000`,
      `https://${yourIp}:5000`,
      `https://${yourIp}:4000`,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'cache-control',
      'pragma',
      'expires',
      'accept',
      'origin',
      'user-agent',
      'referer',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform'
    ],
  }),
)

server.use(express.json())

server.use(requestLogger)

server.use(errorLogger)

server.use('/favicon.ico', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'logoLhc.png'))
})

// redirect vers le swagger
server.get('/', (req: Request, res: Response) => {
  res.redirect('/doc')
})

// swagger — CSP assoupli nécessaire pour que swagger-ui fonctionne (scripts inline)
server.use(
  '/doc',
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        workerSrc: ["'self'", 'blob:'],
      },
    },
  }),
  swaggerUi.serve,
  swaggerUi.setup(swagger, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
)
server.use(
  '/health',
  rateLimiter(1, 61, { motif: 'health' }),
  async (req: Request, res: Response) => {
    return handlerResponse(res, 200, true, { status: 'ok' })
  },
)
server.use(
  '/api',
  rateLimiter(1, 1000, {
    motif: 'global',
    skipPath: ['/api/health', '/favicon.ico'],
  }),
  route,
)

server.use(globalErrorHandler)

server.use(notFoundHandler)

// expose en static le fichier avec les images
server.use('/public', express.static(path.join(__dirname, '..', 'public')))

const port = Number(process.env.PORT) || 4000

// Initialiser Redis avant de démarrer le serveur
async function startServer() {
  try {
    // Connexion à Redis (avec fallback si Redis n'est pas disponible)
    await cacheService.connect()
    logger.info('Redis connected successfully')

    // Initialiser les rôles par défaut
    const { UserService } = require('./service/user')
    await UserService.seedRoles()
    logger.info('Roles seeded successfully')
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache:', error)
  }

  server.listen(port, '0.0.0.0', () => {
    logger.info(`Server is running on port ${port}`, {
      port,
      env: process.env.NODE_ENV,
      timeStamp: new Date().toISOString(),
    })
  })
}

// Gestion de l'arrêt gracieux
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await cacheService.disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  await cacheService.disconnect()
  process.exit(0)
})

startServer()

// Dans les gestionnaires d'erreurs
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  })
  process.exit(1)
})
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason: reason,
    promise: promise,
  })
  process.exit(1)
})

// pour le récuperer dans les fichiers tests
export default server
