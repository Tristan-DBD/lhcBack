import server from '../src/index'
import request from 'supertest'
import { resetDb } from './resetDb'

beforeAll(async () => {
  await resetDb()
})

afterAll(async () => {
  await resetDb()
})

describe("Test endpoints d'authentification", () => {
  describe('POST /api/auth/login', () => {
    it('LOGIN SUCCESS -> Retourne un token', async () => {
      // D'abord créer un utilisateur
      const createRes = await request(server).post('/api/auth/register').send({
        name: 'Test',
        surname: 'User',
        age: 25,
        weight: 70,
        phone: '0601020304',
        role: 'ATHLETE_PROG',
      })

      const token = createRes.body.data[0].message
      const tokenParts = token.split('.')
      const decoded = JSON.parse(
        Buffer.from(tokenParts[1], 'base64').toString(),
      )

      // Maintenant tester le login avec le username du token
      const res = await request(server).post('/api/auth/login').send({
        username: decoded.username,
        password: '123456',
      })

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message).toBeDefined() // token
      expect(typeof res.body.data[0].message).toBe('string')
    })

    it('LOGIN WRONG EMAIL -> Erreur', async () => {
      const res = await request(server).post('/api/auth/login').send({
        username: 'wrong',
        password: '123456',
      })

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe('Username ou mot de passe incorect')
    })

    it('LOGIN WRONG PASSWORD -> Erreur', async () => {
      const res = await request(server).post('/api/auth/login').send({
        username: 'testuser',
        password: 'wrongpassword',
      })

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe('Username ou mot de passe incorect')
    })

    it('LOGIN MISSING FIELDS -> Erreur de validation', async () => {
      const res = await request(server).post('/api/auth/login').send({
        username: 'testuser',
        // password manquant
      })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/register', () => {
    it('REGISTER SUCCESS -> Crée utilisateur et retourne token', async () => {
      const res = await request(server).post('/api/auth/register').send({
        name: 'NewUser',
        surname: 'User',
        age: 30,
        weight: 80,
        phone: '0601020305',
        role: 'ATHLETE_CO',
      })

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message).toBeDefined() // token
      expect(typeof res.body.data[0].message).toBe('string')
    })

    it('REGISTER MISSING FIELDS -> Erreur de validation', async () => {
      const res = await request(server).post('/api/auth/register').send({
        name: 'Incomplete',
        surname: 'User',
        // champs manquants
      })

      expect(res.status).toBe(400)
    })

    it('REGISTER INVALID USERNAME -> Erreur de validation', async () => {
      const res = await request(server).post('/api/auth/register').send({
        name: 'InvalidUser',
        surname: 'Username',
        age: 25,
        weight: 70,
        phone: '0601020307',
        username: 'inv', // username trop court
        password: '123456',
        role: 'ATHLETE_PROG',
      })

      expect([400, 429]).toContain(res.status)
    })
  })
})
