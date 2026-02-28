// Fallback cache en mémoire pour le développement
class MemoryCacheService {
  private cache = new Map<string, { data: any; expiry: number }>()
  private defaultTTL = 300 // 5 minutes

  async get(key: string): Promise<any> {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  async set(
    key: string,
    value: any,
    ttl: number = this.defaultTTL,
  ): Promise<void> {
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + ttl * 1000,
    })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
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
    return true
  }
}

export const memoryCacheService = new MemoryCacheService()
