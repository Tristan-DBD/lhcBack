import { createClient, RedisClientType } from 'redis'
import { memoryCacheService } from './memory-cache'

class CacheService {
  private client: RedisClientType | null = null
  private isConnected: boolean = false
  private useMemoryCache: boolean = false

  constructor() {
    // Utiliser le cache mémoire si Redis n'est pas configuré ou en dev sans Redis
    this.useMemoryCache =
      !process.env.REDIS_URL ||
      process.env.NODE_ENV === 'dev' ||
      process.env.NODE_ENV === 'test'

    if (!this.useMemoryCache) {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
        },
      })

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err)
        this.isConnected = false
      })

      this.client.on('connect', () => {
        console.log('Redis Client Connected')
        this.isConnected = true
      })

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected')
        this.isConnected = false
      })
    } else {
      console.log('Using memory cache (development mode)')
    }
  }

  async connect(): Promise<void> {
    if (this.useMemoryCache) return

    if (!this.isConnected && this.client) {
      try {
        await this.client.connect()
      } catch (error) {
        console.warn('Redis connection failed, using memory cache:', error)
        this.useMemoryCache = true
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect()
    }
  }

  async get(key: string): Promise<any> {
    if (this.useMemoryCache) {
      return await memoryCacheService.get(key)
    }

    try {
      const value = await this.client!.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    if (this.useMemoryCache) {
      await memoryCacheService.set(key, value, ttl)
      return
    }

    try {
      await this.client!.setEx(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async del(key: string): Promise<void> {
    if (this.useMemoryCache) {
      await memoryCacheService.del(key)
      return
    }

    try {
      await this.client!.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (this.useMemoryCache) {
      await memoryCacheService.delPattern(pattern)
      return
    }

    try {
      const keys = await this.client!.keys(pattern)
      if (keys.length > 0) {
        await this.client!.del(keys)
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error)
    }
  }

  generateKey(prefix: string, params: any = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result: any, key) => {
        result[key] = params[key]
        return result
      }, {})

    return `${prefix}:${JSON.stringify(sortedParams)}`
  }

  isHealthy(): boolean {
    return this.useMemoryCache ? true : this.isConnected
  }
}

export const cacheService = new CacheService()
