import server from '../src/index'
import request from 'supertest'
import { resetDb } from './resetDb'

beforeAll(async () => {
  await resetDb()
})

afterAll(async () => {
  await resetDb()
})

describe('Test endpoints d\'authentification', () => {
  describe('POST /api/auth/login', () => {
    it('LOGIN SUCCESS -> Retourne un token', async () => {
      // D'abord créer un utilisateur
      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          surname: 'User',
          age: 25,
          weight: 70,
          phone: '0601020304',
          email: 'test@example.com',
          password: 'password123',
          role: 'ATHLETE_PROG'
        })

      // Maintenant tester le login
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message).toBeDefined() // token
      expect(typeof res.body.data[0].message).toBe('string')
    })

    it('LOGIN WRONG EMAIL -> Erreur', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123'
        })

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe('Email ou mot de passe incorect')
    })

    it('LOGIN WRONG PASSWORD -> Erreur', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe('Email ou mot de passe incorect')
    })

    it('LOGIN MISSING FIELDS -> Erreur de validation', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // password manquant
        })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/register', () => {
    it('REGISTER SUCCESS -> Crée utilisateur et retourne token', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'New',
          surname: 'User',
          age: 30,
          weight: 80,
          phone: '0601020305',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'ATHLETE_CO'
        })

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message).toBeDefined() // token
      expect(typeof res.body.data[0].message).toBe('string')
    })

    it('REGISTER DUPLICATE EMAIL -> Erreur', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate',
          surname: 'User',
          age: 25,
          weight: 70,
          phone: '0601020306',
          email: 'test@example.com', // email déjà utilisé
          password: 'password123',
          role: 'ATHLETE_PROG'
        })

      expect(res.body.success).toBe(false)
      expect(res.body.data[0].message).toBe('Utilisateur déjà existant')
    })

    it('REGISTER MISSING FIELDS -> Erreur de validation', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Incomplete',
          surname: 'User'
          // champs manquants
        })

      expect(res.status).toBe(400)
    })

    it('REGISTER INVALID EMAIL -> Erreur de validation', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Invalid',
          surname: 'Email',
          age: 25,
          weight: 70,
          phone: '0601020307',
          email: 'invalid-email', // email invalide
          password: 'password123',
          role: 'ATHLETE_PROG'
        })

      expect(res.status).toBe(400)
    })
  })
})
