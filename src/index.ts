import dotenv from 'dotenv'
const env = process.env.NODE_ENV || 'dev'
dotenv.config({ path: `.env.${env}` })

import express, { Request, Response } from 'express'
import route from './routes'
import swaggerUi from 'swagger-ui-express'
import swagger from './doc/swagger/bearer'
import path from 'path'
import { requestLogger } from './middleware/logger'
import { globalErrorHandler, handlerResponse, notFoundHandler } from './middleware/handler'
import { rateLimiter } from './middleware/rateLimiter'

const server = express()

server.use(express.json())
server.use(requestLogger)

server.get('/favicon.ico', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '@/lhcBack/public', 'logoLhc.png'))
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
  console.log(`Le serveur est en cours à l'adresse : http://localhost:${port}`)
})

// pour le récuperer dans les fichiers tests
export default server
