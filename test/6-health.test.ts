import server from '../src/index'
import request from 'supertest'
import { createToken } from '../src/routes/login'

describe('Test endpoints de santé', () => {
  let adminToken: string
  let coachToken: string

  beforeAll(async () => {
    adminToken = await createToken(98, 'ADMIN', 'admin@gmail.com')
    coachToken = await createToken(1, 'COACH', 'coach@test.com')
  })

  describe('GET /api/admin/health', () => {
    it('ADMIN -> Authorize', async () => {
      const res = await request(server)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.status).toBeDefined()
      expect(res.body.data[0].message.application).toBeDefined()
      expect(res.body.data[0].message.system).toBeDefined()
      expect(res.body.data[0].message.dependencies).toBeDefined()
      expect(['healthy', 'unhealthy']).toContain(res.body.data[0].message.status)
    })

    it('COACH -> Unauthorize', async () => {
      const res = await request(server)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(403)
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server).get('/api/admin/health')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/admin/health/database', () => {
    it('ADMIN -> Authorize', async () => {
      const res = await request(server)
        .get('/api/admin/health/database')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.status).toBeDefined()
      expect(res.body.data[0].message.responseTime).toBeDefined()
      expect(['Connected', 'Disconnected']).toContain(res.body.data[0].message.status)
    })

    it('COACH -> Unauthorize', async () => {
      const res = await request(server)
        .get('/api/admin/health/database')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.status).toBe(403)
    })

    it('NO TOKEN -> Unauthorized', async () => {
      const res = await request(server).get('/api/admin/health/database')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /health', () => {
    it('PUBLIC -> Accessible sans token', async () => {
      const res = await request(server).get('/health')

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.status).toBe('ok')
    })
  })

  describe('GET /doc', () => {
    it('PUBLIC -> Redirection vers swagger', async () => {
      const res = await request(server).get('/doc')
      
      expect([301, 302, 200]).toContain(res.status)
      if (res.status === 301 || res.status === 302) {
        expect(res.headers.location).toBeDefined()
      } else {
        expect(res.headers['content-type']).toContain('text/html')
      }
    })
  })

  describe('GET /favicon.ico', () => {
    it('PUBLIC -> Retourne l\'icône', async () => {
      const res = await request(server).get('/favicon.ico')
      
      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toContain('image')
    })
  })

  describe('GET /', () => {
    it('PUBLIC -> Redirection vers /doc', async () => {
      const res = await request(server).get('/')
      
      expect(res.status).toBe(302) // Redirect
      expect(res.headers.location).toBe('/doc')
    })
  })
})
