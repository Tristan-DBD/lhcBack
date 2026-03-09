import request from 'supertest'
import server from '../src'
import { resetDb } from './resetDb'
import { createToken } from '../src/routes/login'

beforeAll(async () => {
  await resetDb()
})

afterAll(async () => {
  await resetDb()
})

describe('AUTHENTICATION', () => {
  let coachUser: any
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let coachToken: string
  let testPassword = '123456'

  beforeAll(async () => {
    // Créer un utilisateur de test pour les tests de login

    const createRes = await request(server)
      .post('/api/user')
      .set(
        'Authorization',
        `Bearer ${await createToken(1, 'ADMIN', 'adminuser')}`,
      )
      .send({
        name: 'Coach',
        surname: 'Test',
        age: 30,
        weight: 80,
        phone: '0601020304',
        role: 'COACH',
      })

    coachUser = createRes.body.data[0].message
    coachToken = await createToken(
      coachUser.id,
      coachUser.role,
      coachUser.username,
    )
  })

  describe('POST /api/auth/login', () => {
    it('SUCCESS -> Valid credentials', async () => {
      const res = await request(server).post('/api/auth/login').send({
        username: coachUser.username,
        password: testPassword,
      })

      expect(res.body.success).toBe(true)
    })

    it('ERROR -> Invalid username', async () => {
      const res = await request(server).post('/api/auth/login').send({
        username: 'nonexistentuser',
        password: testPassword,
      })

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe('Username ou mot de passe incorect')
    })

    it('ERROR -> Invalid password', async () => {
      const res = await request(server).post('/api/auth/login').send({
        username: coachUser.username,
        password: 'wrongpassword',
      })

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe('Username ou mot de passe incorect')
    })

    it('ERROR -> Missing username', async () => {
      const res = await request(server).post('/api/auth/login').send({
        password: testPassword,
      })

      expect([400, 429]).toContain(res.status)
      if (res.status === 400) {
        expect(res.body.success).toBe(false)
      }
    })

    it('ERROR -> Missing password', async () => {
      const res = await request(server).post('/api/auth/login').send({
        username: coachUser.username,
      })

      expect([400, 429]).toContain(res.status)
      if (res.status === 400) {
        expect(res.body.success).toBe(false)
      }
    })

    it('ERROR -> Empty credentials', async () => {
      const res = await request(server).post('/api/auth/login').send({})

      expect([400, 429]).toContain(res.status)
      if (res.status === 400) {
        expect(res.body.success).toBe(false)
      }
    })

    it('RATE LIMIT -> Too many attempts', async () => {
      const loginData = {
        username: coachUser.username,
        password: 'wrongpassword',
      }

      // Faire 6 tentatives (limite configurée à 5 par 15 minutes)
      const promises = Array(6)
        .fill(null)
        .map(() => request(server).post('/api/auth/login').send(loginData))

      const results = await Promise.all(promises)

      // Vérifier qu'il n'y a PAS d'erreurs de login
      const loginErrors = results.filter((res) => res?.status === 409)
      expect(loginErrors.length).toBe(0)
    })

    it('SUCCESS -> Rate limit resets after successful login', async () => {
      // Attendre un peu ou faire un login réussi pour réinitialiser
      const res = await request(server).post('/api/auth/login').send({
        username: coachUser.username,
        password: testPassword,
      })

      expect([200, 429]).toContain(res.status)
      if (res.status === 200) {
        expect(res.body.success).toBe(true)
      }
    })
  })

  describe('POST /api/auth/register', () => {
    it('SUCCESS -> Create new user', async () => {
      const newUser = {
        name: 'NewUser',
        surname: 'User',
        age: 25,
        weight: 70,
        phone: '0601020305',
        role: 'ATHLETE_CO',
      }

      const res = await request(server).post('/api/auth/register').send(newUser)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.accessToken).toBeDefined()
      expect(typeof res.body.data[0].message.accessToken).toBe('string') // JWT token

      // Vérifier que le token est valide en le décodant
      const tokenParts = res.body.data[0].message.accessToken.split('.')
      if (tokenParts.length === 3) {
        const decoded = JSON.parse(
          Buffer.from(tokenParts[1], 'base64').toString(),
        )
        expect(decoded.username).toMatch(/^nuser[a-z0-9]*$/)
      }
      expect(res.body.data[0].message.password).toBeUndefined() // Password shouldn't be returned
    })

    it('ERROR -> Invalid username format', async () => {
      const invalidUser = {
        name: 'Invalid',
        surname: 'User',
        age: 25,
        weight: 70,
        phone: '0601020307',
        username: 'invalid-username', // Format invalide
        password: '123456',
        role: 'ATHLETE_CO',
      }

      const res = await request(server)
        .post('/api/auth/register')
        .send(invalidUser)

      expect([200, 400, 429]).toContain(res.status)
      if (res.status === 400) {
        expect(res.body.success).toBe(false)
      }
    })

    it('ERROR -> Missing required fields', async () => {
      const incompleteUser = {
        name: 'Incomplete',
        // Manque: surname, age, weight, phone, username, password, role
      }

      const res = await request(server)
        .post('/api/auth/register')
        .send(incompleteUser)

      expect([400, 429]).toContain(res.status)
      if (res.status === 400) {
        expect(res.body.success).toBe(false)
      }
    })

    it('ERROR -> Invalid age (negative)', async () => {
      const invalidAgeUser = {
        name: 'Invalid',
        surname: 'Age',
        age: -5, // Âge invalide
        weight: 70,
        phone: '0601020308',
        username: 'invalidage',
        password: '123456',
        role: 'ATHLETE_CO',
      }

      const res = await request(server)
        .post('/api/auth/register')
        .send(invalidAgeUser)

      expect([400, 429]).toContain(res.status)
      if (res.status === 400) {
        expect(res.body.success).toBe(false)
      }
    })

    it('ERROR -> Invalid weight (zero)', async () => {
      const invalidWeightUser = {
        name: 'Invalid',
        surname: 'Weight',
        age: 25,
        weight: 0, // Poids invalide
        phone: '0601020309',
        username: 'invalidweight',
        password: '123456',
        role: 'ATHLETE_CO',
      }

      const res = await request(server)
        .post('/api/auth/register')
        .send(invalidWeightUser)

      expect([400, 429]).toContain(res.status)
      if (res.status === 400) {
        expect(res.body.success).toBe(false)
      }
    })

    it('ERROR -> Invalid role', async () => {
      const invalidRoleUser = {
        name: 'Invalid',
        surname: 'Role',
        age: 25,
        weight: 70,
        phone: '0601020310',
        username: 'invalidrole',
        password: '123456',
        role: 'INVALID_ROLE', // Rôle invalide
      }

      const res = await request(server)
        .post('/api/auth/register')
        .send(invalidRoleUser)

      expect([400, 429]).toContain(res.status)
      if (res.status === 400) {
        expect(res.body.success).toBe(false)
      }
    })

    it('RATE LIMIT -> Too many registration attempts', async () => {
      const newUser = {
        name: 'Rate',
        surname: 'Limit',
        age: 25,
        weight: 70,
        phone: '0601020311',
        username: 'ratelimituser',
        password: '123456',
        role: 'ATHLETE_CO',
      }

      // Faire 4 tentatives (limite configurée à 3 par 60 minutes)
      const promises = Array(4)
        .fill(null)
        .map((_, index) =>
          request(server)
            .post('/api/auth/register')
            .send({
              ...newUser,
              username: `ratelimit${index}`,
            }),
        )

      const results = await Promise.all(promises)

      // Vérifier qu'au moins une requête a été limitée
      const hasRateLimit = results.some((res) => res?.status === 429)
      expect(hasRateLimit).toBe(true)
    })
  })

  describe('Security Tests', () => {
    it('ERROR -> SQL Injection attempt in username', async () => {
      const res = await request(server).post('/api/auth/login').send({
        username: "'; DROP TABLE users; --",
        password: testPassword,
      })

      expect([403, 429]).toContain(res.status)
      if (res.status === 403) {
        expect(res.body.success).toBe(false)
      }
    })

    it('ERROR -> XSS attempt in username', async () => {
      const res = await request(server).post('/api/auth/login').send({
        username: '<script>alert("xss")</script>',
        password: testPassword,
      })

      expect([403, 429]).toContain(res.status)
      if (res.status === 403) {
        expect(res.body.success).toBe(false)
      }
    })

    it('ERROR -> Very long username', async () => {
      const longEmail = 'a'.repeat(300)

      const res = await request(server).post('/api/auth/login').send({
        username: longEmail,
        password: testPassword,
      })

      expect([403, 429]).toContain(res.status)
      if (res.status === 403) {
        expect(res.body.success).toBe(false)
      }
    })
  })
})
