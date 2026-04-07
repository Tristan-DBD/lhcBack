import { Request, Response, NextFunction } from 'express'
import { cacheService } from '../config/cache'

interface CacheOptions {
  ttl?: number
  keyGenerator?: (req: Request) => string
  condition?: (req: Request) => boolean
}

/**
 * Middleware pour mettre en cache les réponses des routes GET
 * @param prefix Préfixe pour la clé de cache
 * @param options Options de configuration du cache
 */
export const cacheMiddleware = (prefix: string, options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes par défaut
    keyGenerator = (req) => {
      // Génère une clé basée sur l'URL et les paramètres de requête
      const queryParams = { ...req.query }
      delete queryParams.t // Supprimer les timestamps si présents
      return cacheService.generateKey(prefix, {
        url: req.originalUrl,
        ...queryParams,
      })
    },
    condition = (req) => req.method === 'GET',
  } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    // Vérifier si le cache doit être appliqué
    if (!condition(req)) {
      return next()
    }

    // Vérifier si Redis est connecté
    if (!cacheService.isHealthy()) {
      return next()
    }

    const cacheKey = keyGenerator(req)

    try {
      // Vérifier si la réponse est en cache
      const cachedResponse = await cacheService.get(cacheKey)

      if (cachedResponse) {
        return res.status(200).json(cachedResponse)
      }

      // Intercepter la réponse pour la mettre en cache
      const originalJson = res.json
      const originalStatus = res.status

      res.json = function (data: any) {
        // Mettre en cache uniquement les réponses réussies
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, ttl).catch((error) => {
            console.error('Failed to cache response:', error)
          })
        }
        return originalJson.call(this, data)
      }

      res.status = function (code: number) {
        originalStatus.call(this, code)
        return this
      }

      next()
    } catch (error) {
      console.error('Cache middleware error:', error)
      next()
    }
  }
}

/**
 * Middleware pour invalider le cache
 * @param patterns Patterns des clés à invalider
 */
export const invalidateCacheMiddleware = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Exécuter la route d'abord
    const originalSend = res.send
    let responseData: any

    res.send = function (data: any) {
      responseData = data
      return originalSend.call(this, responseData)
    }

    // Intercepter la fin de la réponse
    res.on('finish', async () => {
      // Invalider le cache uniquement si la réponse est réussie
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          for (const pattern of patterns) {
            await cacheService.delPattern(pattern)
          }
        } catch (error) {
          console.error('Failed to invalidate cache:', error)
        }
      }
    })

    next()
  }
}

/**
 * Helper pour générer des patterns d'invalidation
 */
export const cachePatterns = {
  courses: {
    all: 'courses:*',
    byId: (id: string) => `courses:*${id}*`,
    byCoach: (coachId: string) => `courses:*coachId*${coachId}*`,
  },
  users: {
    all: 'users:*',
    byId: (id: string) => `users:*${id}*`,
  },
  stats: {
    all: 'stats:*',
    byUser: (userId: string) => `stats:*userId*${userId}*`,
  },
  orders: {
    all: 'orders:*',
  },
  coachingSlots: {
    all: 'coaching-slots:*',
    byId: (id: string) => `coaching-slots:*${id}*`,
    byCoach: (coachId: string) => `coaching-slots:*coachId*${coachId}*`,
  },
}
