import server from '../src'
import request from 'supertest'
import { resetDb } from './resetDb'
import { createToken } from '../src/routes/login'

let coachId: number
let athleteId: number
let coachStatId: number
let athStatId: number
let coachToken: string
let athleteToken: string

describe('Test CRUD pour les stats des utilisateurs', () => {
  async function token() {
    coachToken = await createToken(1, 'COACH', 'username')
    athleteToken = await createToken(2, 'ATHLETE_PROG', 'username')
  }

  beforeAll(async () => {
    await token()
    await resetDb()
    const createdCoach = await request(server)
      .post('/api/user')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({
        name: 'Test',
        surname: 'Testest',
        age: 23,
        weight: 85,
        phone: '0601020304',
        username: 'coachuser',
        password: '1234',
        role: 'COACH',
      })

    coachId = createdCoach.body.data[0].message.id

    // Création des utilisateurs
    const createdAth = await request(server)
      .post('/api/user')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({
        name: 'Test',
        surname: 'Testest',
        age: 23,
        weight: 85,
        phone: '0601020304',
        username: 'athleteuser',
        password: '1234',
        role: 'ATHLETE_PROG',
      })
    athleteId = createdAth.body.data[0].message.id
  })

  afterAll(async () => {
    await resetDb()
  })

  describe('CREATE (POST /api/stats)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .post('/api/stats')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          userId: coachId,
          squat: 200,
          bench: 200,
          deadlift: 200,
        })

      coachStatId = res.body.data[0].message.id
      expect(res.body.success).toBe(true)
    })
    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .post('/api/stats')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          userId: athleteId,
          squat: 200,
          bench: 200,
          deadlift: 200,
        })
      expect(res.body.success).toBe(false)

      // crée une fiche de stat ath pour la suite des tests
      const ATH = await request(server)
        .post('/api/stats')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          userId: athleteId,
          squat: 200,
          bench: 200,
          deadlift: 200,
        })

      athStatId = ATH.body.data[0].message.id
    })
  })
  describe('GET ALL (/api/stats)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get('/api/stats')
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
    })
    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .get('/api/stats')
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(false)
    })
  })
  describe('GET BY ID (GET /api/stats/id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .get(`/api/stats/${coachStatId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
    })
    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .get(`/api/stats/${athStatId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(false)
    })
  })
  describe('UPDATE (PUT /api/stats/)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .put('/api/stats')
        .set('Authorization', `Bearer ${coachToken}`)
        .send({
          userId: coachId,
          squat: 99,
        })

      expect(res.body.success).toBe(true)
      expect(res.body.data[0].message.squat).toBe(99)
    })
    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .put('/api/stats')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          userId: athleteId,
          squat: 99,
        })

      expect(res.body.success).toBe(false)
    })
  })
  describe('DELETE (DELETE /api/stats/id)', () => {
    it('COACH -> Authorize', async () => {
      const res = await request(server)
        .delete(`/api/stats/${coachStatId}`)
        .set('Authorization', `Bearer ${coachToken}`)

      expect(res.body.success).toBe(true)
    })
    it('ATHLETE -> Unauthorize', async () => {
      const res = await request(server)
        .delete(`/api/stats/${athStatId}`)
        .set('Authorization', `Bearer ${athleteToken}`)

      expect(res.body.success).toBe(false)
    })
  })
})
