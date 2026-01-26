import dotenv from 'dotenv'
const env = process.env.NODE_ENV || 'dev'
dotenv.config({ path: `.env.${env}` })

import express, { Request, Response } from 'express'
import route from './routes'
import swaggerUi from 'swagger-ui-express'
import swagger from './doc/swagger/bearer'
import path from 'path'
import { globalErrorHandler, handlerResponse, notFoundHandler } from './middleware/handler'
import { rateLimiter } from './middleware/rateLimiter'
import cors from 'cors'
import helmet from 'helmet'
import logger from './config/logger'
import { errorLogger } from './middleware/errorLogger'
import { requestLogger } from './middleware/logger'

const server = express()
server.set('trust proxy', 1)
const yourIp = process.env.YOUR_IP || 'localhost'

server.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'",
        `http://${yourIp}`,
        `https://${yourIp}`],
    }
  },
}))

server.use(cors({
  origin: [
    'http://localhost:3000',
    `http://${yourIp}`,
    `https://${yourIp}`,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

server.use(express.json())

server.use(requestLogger)

server.use(errorLogger)

server.get('/favicon.ico', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../public', 'logoLhc.png'))
})

// redirect vers le swagger
server.get('/', (req: Request, res: Response) => {
  res.redirect('/doc')
})

// swagger
server.use(
  '/doc',
  swaggerUi.serve,
  swaggerUi.setup(swagger, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
)
server.use('/health', rateLimiter(1, 61, { motif: 'health' }), async (req: Request, res: Response) => {
  return handlerResponse(res, 200, true, { status: 'ok' })
})
server.use('/api', rateLimiter(1, 1000, { motif: 'global', skipPath: ['/api/health', '/favicon.ico'] }), route)

server.use(globalErrorHandler)

server.use(notFoundHandler)

// expose en static le fichier avec les images
server.use('/public', express.static(path.join(__dirname, '..', 'public')))

const port = Number(process.env.PORT) || 4000
server.listen(port, () => {
  logger.info(`Server is running on port ${port}`, {
    port,
    env: process.env.NODE_ENV,
    timeStamp: new Date().toISOString(),
  })
})



// Dans les gestionnaires d'erreurs
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  })
  process.exit(1)
})
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason: reason,
    promise: promise
  })
  process.exit(1)
})

// pour le récuperer dans les fichiers tests
export default server
