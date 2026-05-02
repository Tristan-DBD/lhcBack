import {
  Get,
  Route,
  Security,
  Tags,
} from 'tsoa'

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  uptime: number
  timestamp: string
  application: {
    name: string
    version: string
    environment: string
    port: number
    startTime: string
  }
  system: {
    nodeVersion: string
    platform: string
    memory: {
      used: string
      total: string
    }
  }
  dependencies: {
    database: {
      status: string
      responseTime: string
      error?: string
    }
    supabase: {
      status: string
      responseTime: string
      error?: string
    }
  }
}

interface DatabaseHealthResponse {
  status: string
  responseTime: string
  error?: string
}

@Route('admin/health')
@Tags('Santé Système')
export class HealthController {
  @Get('/')
  @Security('BearerAuth')
  public async getHealth(): Promise<HealthCheckResponse> {
    return {} as any
  }

  @Get('/database')
  @Security('BearerAuth')
  public async getDatabaseHealth(): Promise<DatabaseHealthResponse> {
    return {} as any
  }
}
